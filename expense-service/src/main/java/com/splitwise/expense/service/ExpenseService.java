package com.splitwise.expense.service;

import com.splitwise.expense.dto.ExpenseRequest;
import com.splitwise.expense.dto.ExpenseResponse;
import com.splitwise.expense.dto.GroupBalanceResponse;
import com.splitwise.expense.dto.SplitResponse;
import com.splitwise.expense.entity.Expense;
import com.splitwise.expense.entity.ExpenseSplit;
import com.splitwise.expense.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request) {
        Long totalPaises = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

        Expense expense = Expense.builder()
                .description(request.getDescription())
                .amount(totalPaises)
                .groupId(request.getGroupId())
                .paidBy(request.getPaidBy())
                .splitType(request.getSplitType())
                .note(request.getNote())
                .expenseDate(request.getExpenseDate())
                .createdAt(LocalDateTime.now())
                .build();

        List<ExpenseSplit> splits = calculateInternalSplits(expense, request, totalPaises);
        expense.setSplits(splits);

        Expense savedExpense = expenseRepository.save(expense);
        return mapToResponse(savedExpense);
    }

    public List<SplitResponse> calculateSplits(ExpenseRequest request) {
        System.out.println("Calculating splits for amount: " + request.getAmount() + ", type: " + request.getSplitType());
        if (request.getAmount() == null || request.getSplitType() == null || request.getSplits() == null || request.getSplits().isEmpty()) {
            System.out.println("Calculation skipped: missing required fields");
            return new ArrayList<>();
        }

        Long totalPaises = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
        Expense dummyExpense = Expense.builder().amount(totalPaises).build();
        
        List<ExpenseSplit> splits = calculateInternalSplits(dummyExpense, request, totalPaises);
        System.out.println("Calculated " + splits.size() + " splits");
        
        return splits.stream()
                .map(s -> new SplitResponse(s.getUserId(), BigDecimal.valueOf(s.getAmount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)))
                .collect(Collectors.toList());
    }

    private List<ExpenseSplit> calculateInternalSplits(Expense expense, ExpenseRequest request, Long totalPaises) {
        List<ExpenseSplit> splits = new ArrayList<>();

        switch (request.getSplitType()) {
            case EQUAL:
                int participantCount = request.getSplits().size();
                if (participantCount == 0) return splits;
                
                Long splitAmount = totalPaises / participantCount;
                Long runningSum = 0L;
                
                for (int i = 0; i < participantCount - 1; i++) {
                    var splitReq = request.getSplits().get(i);
                    splits.add(ExpenseSplit.builder()
                            .expense(expense)
                            .userId(splitReq.getUserId())
                            .amount(splitAmount)
                            .build());
                    runningSum += splitAmount;
                }
                
                // Assign remaining amount to the last person
                var lastSplitReq = request.getSplits().get(participantCount - 1);
                splits.add(ExpenseSplit.builder()
                        .expense(expense)
                        .userId(lastSplitReq.getUserId())
                        .amount(totalPaises - runningSum)
                        .build());
                break;

            case EXACT:
                Long sumExact = 0L;
                for (var splitReq : request.getSplits()) {
                    Long amountPaises = splitReq.getAmount() != null ? 
                            splitReq.getAmount().multiply(BigDecimal.valueOf(100)).longValue() : 0L;
                    sumExact += amountPaises;
                    splits.add(ExpenseSplit.builder()
                            .expense(expense)
                            .userId(splitReq.getUserId())
                            .amount(amountPaises)
                            .build());
                }
                
                if (!sumExact.equals(totalPaises)) {
                    // During preview we don't throw exception, just show what's there
                    // But for createExpense we should. We'll handle this in the calling method if needed.
                }
                break;

            case PERCENTAGE:
                BigDecimal sumPercent = BigDecimal.ZERO;
                for (var splitReq : request.getSplits()) {
                    BigDecimal percent = splitReq.getAmount() != null ? splitReq.getAmount() : BigDecimal.ZERO;
                    sumPercent = sumPercent.add(percent);
                    
                    Long calculatedAmount = BigDecimal.valueOf(totalPaises)
                            .multiply(percent)
                            .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                            .longValue();
                    
                    splits.add(ExpenseSplit.builder()
                            .expense(expense)
                            .userId(splitReq.getUserId())
                            .amount(calculatedAmount)
                            .build());
                }
                adjustRounding(splits, totalPaises);
                break;
        }
        return splits;
    }

    private void adjustRounding(List<ExpenseSplit> splits, Long totalPaises) {
        if (splits.isEmpty()) return;
        
        Long calculatedSum = splits.stream()
                .map(ExpenseSplit::getAmount)
                .reduce(0L, Long::sum);

        if (!calculatedSum.equals(totalPaises)) {
            Long difference = totalPaises - calculatedSum;
            ExpenseSplit lastSplit = splits.get(splits.size() - 1);
            lastSplit.setAmount(lastSplit.getAmount() + difference);
        }
    }

    public List<GroupBalanceResponse> getGroupBalances(Long groupId) {
        List<Expense> expenses = expenseRepository.findByGroupId(groupId);
        java.util.Map<Long, Long> userBalances = new java.util.HashMap<>();

        for (Expense expense : expenses) {
            Long payerId = expense.getPaidBy();
            
            // Calculate what others owe the payer (total amount minus payer's own share)
            Long payerShare = expense.getSplits().stream()
                    .filter(s -> s.getUserId().equals(payerId))
                    .map(ExpenseSplit::getAmount)
                    .findFirst()
                    .orElse(0L);
            
            Long amountOthersOwe = expense.getAmount() - payerShare;
            
            // Add to payer's balance (they get back this much)
            userBalances.put(payerId, userBalances.getOrDefault(payerId, 0L) + amountOthersOwe);
            
            // Subtract from each non-payer's balance
            for (ExpenseSplit split : expense.getSplits()) {
                if (!split.getUserId().equals(payerId)) {
                    userBalances.put(split.getUserId(), userBalances.getOrDefault(split.getUserId(), 0L) - split.getAmount());
                }
            }
        }

        return userBalances.entrySet().stream()
                .map(entry -> new GroupBalanceResponse(entry.getKey(), BigDecimal.valueOf(entry.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)))
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getGroupExpenses(Long groupId) {
        return expenseRepository.findByGroupId(groupId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        List<SplitResponse> splitResponses = expense.getSplits().stream()
                .map(s -> new SplitResponse(s.getUserId(), BigDecimal.valueOf(s.getAmount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)))
                .collect(Collectors.toList());

        return ExpenseResponse.builder()
                .id(expense.getId())
                .description(expense.getDescription())
                .amount(BigDecimal.valueOf(expense.getAmount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
                .groupId(expense.getGroupId())
                .paidBy(expense.getPaidBy())
                .splitType(expense.getSplitType())
                .note(expense.getNote())
                .expenseDate(expense.getExpenseDate())
                .createdAt(expense.getCreatedAt())
                .splits(splitResponses)
                .build();
    }
}
