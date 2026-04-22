package com.splitwise.group.security;

import com.splitwise.group.client.AuthServiceClient;
import com.splitwise.group.config.UserContext;
import com.splitwise.group.dto.ValidateTokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtInterceptor implements HandlerInterceptor {

    private final AuthServiceClient authServiceClient;

    public JwtInterceptor(AuthServiceClient authServiceClient) {
        this.authServiceClient = authServiceClient;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            ValidateTokenResponse validationResponse = authServiceClient.validateToken(token);

            if (validationResponse != null && validationResponse.isValid()) {
                // Store user ID in ThreadLocal context
                UserContext.setUserId(validationResponse.getUserId());
                return true;
            }
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        return false;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // Clear context to prevent memory leaks
        UserContext.clear();
    }
}
