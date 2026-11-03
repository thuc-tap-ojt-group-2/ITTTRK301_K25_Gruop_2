package com.ptit.library_management.controller;

import com.ptit.library_management.dto.BookResponse;
import com.ptit.library_management.dto.PageResponse;
import com.ptit.library_management.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ frontend test không bị chặn CORS
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<PageResponse<BookResponse>> getBooks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(bookService.getBooks(page, size));
    }
}