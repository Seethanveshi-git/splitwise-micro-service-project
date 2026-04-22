package com.splitwise.expense.controller;

import com.splitwise.expense.dto.ExpenseRequest;
import com.splitwise.expense.dto.ExpenseResponse;
import com.splitwise.expense.dto.GroupBalanceResponse;
import com.splitwise.expense.dto.SplitResponse;
import com.splitwise.expense.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.createExpense(request));
    }

    @PostMapping("/calculate")
    public ResponseEntity<List<SplitResponse>> calculateSplits(@RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.calculateSplits(request));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ExpenseResponse>> getGroupExpenses(@PathVariable Long groupId) {
        return ResponseEntity.ok(expenseService.getGroupExpenses(groupId));
    }

    @GetMapping("/group/{groupId}/balances")
    public ResponseEntity<List<GroupBalanceResponse>> getGroupBalances(@PathVariable Long groupId) {
        return ResponseEntity.ok(expenseService.getGroupBalances(groupId));
    }
}
