package com.splitwise.group.client;

import com.splitwise.group.dto.UserDTO;
import com.splitwise.group.dto.ValidateTokenResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "auth-service", url = "${auth-service.url}")
public interface AuthServiceClient {

    @GetMapping("/api/auth/validate")
    ValidateTokenResponse validateToken(@RequestHeader("Authorization") String token);

    @GetMapping("/api/auth/user")
    UserDTO getOrCreateUser(@RequestParam("email") String email, @RequestParam("name") String name);

    @GetMapping("/api/auth/users/list")
    List<UserDTO> getUsersByIds(@RequestParam("ids") List<Long> ids);
}
