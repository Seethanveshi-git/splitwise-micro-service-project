package com.splitwise.expense.dto;

import com.splitwise.expense.entity.SplitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseResponse {
    private Long id;
    private String description;
    private BigDecimal amount;
    private Long groupId;
    private Long paidBy;
    private SplitType splitType;
    private String note;
    private java.time.LocalDateTime expenseDate;
    private LocalDateTime createdAt;
    private List<SplitResponse> splits;
}
