package com.splitwise.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Component
public class SlidingWindowRateLimitGatewayFilterFactory extends AbstractGatewayFilterFactory<SlidingWindowRateLimitGatewayFilterFactory.Config> {

    private final ReactiveStringRedisTemplate redisTemplate;

    @Value("${jwt.secret}")
    private String secret;

    public SlidingWindowRateLimitGatewayFilterFactory(ReactiveStringRedisTemplate redisTemplate) {
        super(Config.class);
        this.redisTemplate = redisTemplate;
    }

    public static class Config {
        private int limit;
        private int windowSeconds;

        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
        public int getWindowSeconds() { return windowSeconds; }
        public void setWindowSeconds(int windowSeconds) { this.windowSeconds = windowSeconds; }
    }

    @Override
    public List<String> shortcutFieldOrder() {
        return List.of("limit", "windowSeconds");
    }

    @Override
    public GatewayFilter apply(Config config) {
            return (exchange, chain) -> {
                // Only rate limit POST requests (Add Expense)
            String path = exchange.getRequest().getURI().getPath();

            // Only rate limit the "Add Expense" endpoint (POST /api/expenses)
            // Skip for sub-paths like /api/expenses/calculate or /api/expenses/123/edit
            if (!"POST".equalsIgnoreCase(exchange.getRequest().getMethod().name()) || !"/api/expenses".equals(path)) {
                return chain.filter(exchange);
            }

            HttpCookie jwtCookie = exchange.getRequest().getCookies().getFirst("jwt");
            if (jwtCookie == null) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            try {
                String token = jwtCookie.getValue();
                
                // Decode secret using Base64 (matches Auth Service)
                byte[] keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secret);
                
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(Keys.hmacShaKeyFor(keyBytes))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                Object userIdObj = claims.get("userId");
                if (userIdObj == null) {
                    throw new RuntimeException("userId claim missing");
                }
                
                String userId = userIdObj.toString();
                String redisKey = "rate_limit:expenses:" + userId;
                long now = Instant.now().toEpochMilli();
                double windowStart = (double) now - (config.getWindowSeconds() * 1000L);

                return redisTemplate.opsForZSet()
                        .removeRangeByScore(redisKey, Range.closed(0.0, windowStart))
                        .then(redisTemplate.opsForZSet().count(redisKey, Range.closed(windowStart, (double) now + 1000L)))
                        .flatMap(count -> {
                            if (count >= config.getLimit()) {
                                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                                return exchange.getResponse().setComplete();
                            }
                            return redisTemplate.opsForZSet().add(redisKey, String.valueOf(now), (double) now)
                                    .then(chain.filter(exchange));
                        });

            } catch (Exception e) {
                System.err.println("Rate Limit Filter Error: " + e.getMessage());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        };
    }
}
