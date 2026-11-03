package com.ptit.library_management.repository;

import com.ptit.library_management.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    @EntityGraph(attributePaths = {"category"})
    @Query(value = "SELECT b FROM Book b", countQuery = "SELECT COUNT(b) FROM Book b")
    Page<Book> findAllWithCategory(Pageable pageable);
}