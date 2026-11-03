package com.ptit.library_management.dto;

import com.ptit.library_management.entity.Book;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BookResponse {
    private Long id;
    private String title;
    private String author;
    private String categoryName;
    private Integer totalCopies;
    private Integer availableCopies;
    private String imageUrl;

    public static BookResponse fromEntity(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .categoryName(book.getCategory() != null ? book.getCategory().getName() : "")
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .imageUrl(book.getImageUrl())
                .build();
    }
}