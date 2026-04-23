package com.splitwise.dashboard.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@FeignClient(name = "group-service")
public interface GroupServiceClient {

    @GetMapping("/api/groups/{groupId}")
    Object getGroupDetails(@PathVariable("groupId") Long groupId, @RequestHeader("Authorization") String token);

    @GetMapping("/api/groups")
    List<Object> getUserGroups(@RequestHeader("Authorization") String token);
}
