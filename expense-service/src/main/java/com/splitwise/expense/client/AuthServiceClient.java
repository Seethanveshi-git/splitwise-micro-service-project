package com.splitwise.expense.client;

import com.splitwise.expense.dto.ValidateTokenResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "auth-service", url = "${auth-service.url}")
public interface AuthServiceClient {
    
    @GetMapping("/api/auth/validate")
    ValidateTokenResponse validateToken(@RequestHeader("Authorization") String token);
}
