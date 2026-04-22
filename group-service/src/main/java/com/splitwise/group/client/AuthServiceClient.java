package com.splitwise.group.client;

import com.splitwise.group.dto.ValidateTokenResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class AuthServiceClient {

    private final RestTemplate restTemplate;

    @Value("${auth-service.url}")
    private String authServiceUrl;

    public AuthServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public ValidateTokenResponse validateToken(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<ValidateTokenResponse> response = restTemplate.exchange(
                    authServiceUrl + "/api/auth/validate",
                    HttpMethod.GET,
                    entity,
                    ValidateTokenResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            return new ValidateTokenResponse(null, null, false);
        }
    }
}
