package com.splitwise.dashboard.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@FeignClient(name = "expense-service")
public interface ExpenseServiceClient {

    @GetMapping("/api/expenses/group/{groupId}")
    List<Object> getGroupExpenses(@PathVariable("groupId") Long groupId, @RequestHeader("Authorization") String token);

    @GetMapping("/api/expenses/group/{groupId}/balances")
    List<Object> getGroupBalances(@PathVariable("groupId") Long groupId, @RequestHeader("Authorization") String token);
}
