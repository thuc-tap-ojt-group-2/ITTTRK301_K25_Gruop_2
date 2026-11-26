(function (global) {
    const comments = [
        "Cách trình bày dễ theo dõi, các khái niệm được giải thích khá rõ.",
        "Nội dung hữu ích để tham khảo khi học tập. Một vài phần cần đọc chậm để nắm hết ý.",
        "Bố cục hợp lý và ví dụ minh họa giúp tôi hiểu bài tốt hơn.",
        "Cuốn sách có nhiều thông tin giá trị, nhưng một số chủ đề cần thêm chi tiết.",
        "Bìa sách đẹp, chất lượng in ổn. Nội dung phù hợp để đọc và tra cứu lại.",
        "Cách viết gần gũi, dễ tiếp cận. Tôi muốn có thêm ví dụ thực tế ở một số chương.",
        "Một tài liệu hữu ích, các chương nối tiếp nhau mạch lạc.",
        "Nội dung có ích nhưng một vài đoạn diễn giải còn ngắn."
    ];

    global.PTIT_SAMPLE_REVIEWS = Object.freeze({
        forBook(bookId) {
            const id = Number(bookId);
            if (!Number.isSafeInteger(id) || id < 1) return [];
            const count = 4 + (id % 5);
            return Array.from({ length: count }, function (_, index) {
                const dateOffset = (id * 7 + index * 13) % 86;
                const reviewDate = new Date(Date.UTC(2026, 8, 1 + dateOffset))
                    .toISOString()
                    .slice(0, 10);
                return {
                    id: "sample-" + id + "-" + (index + 1),
                    bookId: id,
                    userId: "sample-reader-" + id + "-" + (index + 1),
                    name: "Độc giả mẫu " + String(((id * 3 + index * 7) % 60) + 1).padStart(2, "0"),
                    stars: ((id + index * 2) % 5) + 1,
                    comment: comments[(id * 3 + index * 5) % comments.length],
                    date: reviewDate,
                    isSample: true
                };
            });
        }
    });
})(window);
