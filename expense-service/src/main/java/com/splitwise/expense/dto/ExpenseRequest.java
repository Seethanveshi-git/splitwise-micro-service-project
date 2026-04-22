package com.splitwise.expense.dto;

import com.splitwise.expense.entity.SplitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequest {

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotNull(message = "PaidBy user ID is required")
    private Long paidBy;

    @NotNull(message = "Split type is required")
    private SplitType splitType;

    private String note;

    @NotNull(message = "Expense date is required")
    private java.time.LocalDateTime expenseDate;

    private List<SplitRequest> splits;
}
