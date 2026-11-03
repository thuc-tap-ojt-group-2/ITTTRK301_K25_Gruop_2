package com.ptit.library_management.service;

import com.ptit.library_management.dto.BookResponse;
import com.ptit.library_management.dto.PageResponse;
import com.ptit.library_management.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    @Transactional(readOnly = true)
    public PageResponse<BookResponse> getBooks(int page, int size) {
        // Cố định mặc định 10 sách/trang theo yêu cầu BOOK-01
        int pageIndex = Math.max(0, page - 1);
        int pageSize = (size > 0) ? size : 10;
        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by("id").descending());

        return PageResponse.fromPage(
                bookRepository.findAllWithCategory(pageable).map(BookResponse::fromEntity)
        );
    }
}