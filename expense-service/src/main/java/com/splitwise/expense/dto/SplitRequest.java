package com.splitwise.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SplitRequest {
    private Long userId;
    private BigDecimal amount; // Amount or Percentage
}
