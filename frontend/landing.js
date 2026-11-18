const bookTrack = document.getElementById("bookTrack");
const bookTickerStatus = document.getElementById("bookTickerStatus");
const bookCarousel = document.getElementById("bookCarousel");
const coverColors = ["#0b6e4f", "#17679a", "#b7852f", "#6a4c93", "#c0392b", "#2f9e6d"];

function createBookCard(book, index) {
    const card = document.createElement("article");
    const title = document.createElement("strong");
    const author = document.createElement("span");
    const copy = document.createElement("div");
    const category = document.createElement("span");
    const imageUrl = typeof book.imageUrl === "string" ? book.imageUrl : book.image_url;

    card.className = "ticker-book";
    card.style.backgroundColor = coverColors[index % coverColors.length];
    card.setAttribute("aria-label", [book.title, book.author].filter(Boolean).join(" — "));

    if (typeof imageUrl === "string" && imageUrl.trim()) {
        const image = document.createElement("img");
        image.src = imageUrl.trim();
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", function () {
            card.remove();
            console.warn("Không tải được ảnh bìa sách:", imageUrl);
            if (bookTrack.children.length === 0) {
                bookTickerStatus.textContent = "Không tải được ảnh bìa sách. Vui lòng kiểm tra các đường dẫn imageUrl trong database.";
                bookTickerStatus.hidden = false;
            }
        }, { once: true });
        card.appendChild(image);
    } else {
        return null;
    }

    category.className = "ticker-book-category";
    category.textContent = book.categoryName || book.category_name || "Sách thư viện";
    title.className = "ticker-book-title";
    title.textContent = book.title || "Chưa có tên sách";
    author.className = "ticker-book-author";
    author.textContent = book.author || "Chưa có thông tin tác giả";
    copy.className = "ticker-book-copy";
    copy.append(title, author);
    card.append(category, copy);
    return card;
}

function renderBookTicker(books) {
    bookTrack.replaceChildren();

    const booksWithCovers = books.filter(function (book) {
        const imageUrl = typeof book.imageUrl === "string" ? book.imageUrl : book.image_url;
        return typeof imageUrl === "string" && Boolean(imageUrl.trim());
    });

    booksWithCovers.forEach(function (book, index) {
        const card = createBookCard(book, index);
        if (card) {
            bookTrack.appendChild(card);
        }
    });

    if (booksWithCovers.length === 0) {
        bookTickerStatus.textContent = books.length === 0
            ? "Thư viện chưa có đầu sách để hiển thị."
            : "Thư viện chưa có sách kèm ảnh bìa trong database.";
        bookTickerStatus.hidden = false;
        return;
    }

    bookTickerStatus.hidden = true;
}

function renderHomepageStats(response, books) {
    const categories = new Set();
    const copies = books.reduce(function (total, book) {
        const value = Number(book.totalCopies ?? book.total_copies ?? 0);
        return total + (Number.isFinite(value) ? value : 0);
    }, 0);

    books.forEach(function (book) {
        const category = book.categoryName || book.category_name;
        const categoryId = book.categoryId ?? book.category_id;
        const key = category || categoryId;
        if (key !== undefined && key !== null && String(key).trim()) {
            categories.add(String(key).trim().toLocaleLowerCase());
        }
    });

    const titleCount = Number(response.totalElements ?? response.total ?? books.length);
    const stats = {
        titles: Number.isFinite(titleCount) ? titleCount : books.length,
        copies: copies,
        categories: categories.size
    };

    document.querySelectorAll("[data-home-stat]").forEach(function (element) {
        element.textContent = Number(stats[element.dataset.homeStat]).toLocaleString("vi-VN");
    });
}

let tickerIndex = 0;
let tickerDirection = 1;
let tickerPaused = false;

function moveBookTicker() {
    if (tickerPaused || bookTrack.children.length < 2) {
        return;
    }

    const maxOffset = Math.max(0, bookTrack.scrollWidth - bookCarousel.clientWidth);
    const card = bookTrack.firstElementChild;
    const gap = parseFloat(window.getComputedStyle(bookTrack).columnGap) || 0;
    const step = card.getBoundingClientRect().width + gap;
    const maxIndex = Math.ceil(maxOffset / step);

    if (maxIndex === 0) {
        tickerIndex = 0;
        bookTrack.style.transform = "translateX(0)";
        return;
    }

    if (tickerIndex >= maxIndex) {
        tickerDirection = -1;
    } else if (tickerIndex <= 0) {
        tickerDirection = 1;
    }

    tickerIndex = Math.max(0, Math.min(maxIndex, tickerIndex + tickerDirection));
    bookTrack.style.transform = "translateX(-" + Math.min(tickerIndex * step, maxOffset) + "px)";
}

bookCarousel.addEventListener("mouseenter", function () {
    tickerPaused = true;
});
bookCarousel.addEventListener("mouseleave", function () {
    tickerPaused = false;
});
bookCarousel.addEventListener("focusin", function () {
    tickerPaused = true;
});
bookCarousel.addEventListener("focusout", function () {
    tickerPaused = false;
});
document.addEventListener("visibilitychange", function () {
    tickerPaused = document.hidden;
});

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(moveBookTicker, 2800);
}

const homepageApiBaseUrl = (
    window.PTIT_API_BASE_URL ||
    (window.location.protocol === "https:" ? "https:" : "http:") +
        "//" + (window.location.hostname || "127.0.0.1") + ":8000"
).replace(/\/+$/, "");

fetch(homepageApiBaseUrl + "/api/books?page=1&size=100")
    .then(async function (response) {
        let payload;

        try {
            payload = await response.json();
        } catch {
            throw new Error("Backend trả về dữ liệu không hợp lệ.");
        }

        if (!response.ok) {
            const detail = payload && (payload.detail || payload.message);
            throw new Error(typeof detail === "string" ? detail : "Máy chủ trả về lỗi HTTP " + response.status + ".");
        }

        return payload;
    })
    .then(function (response) {
        const books = Array.isArray(response)
            ? response
            : response && Array.isArray(response.content)
                ? response.content
                : response && Array.isArray(response.items)
                    ? response.items
                    : null;

        if (books === null) {
            throw new Error("Dữ liệu sách từ máy chủ không đúng định dạng.");
        }

        renderBookTicker(books);
        renderHomepageStats(response, books);
    })
    .catch(function (error) {
        const homeStatsStatus = document.getElementById("homeStatsStatus");
        if (homeStatsStatus) {
            homeStatsStatus.textContent = "Không tải được số liệu từ API thư viện.";
        }

        if (window.location.protocol === "file:") {
            bookTickerStatus.textContent = "Trang đang mở bằng file://. Hãy mở bằng http://localhost:5500/index.html và kiểm tra Backend đang chạy tại cổng 8000.";
        } else if (error instanceof TypeError) {
            bookTickerStatus.textContent = "Không kết nối được API sách tại " + homepageApiBaseUrl + ". Nếu Backend đã chạy, hãy kiểm tra cổng 8000 và cấu hình CORS.";
        } else {
            bookTickerStatus.textContent = "Không tải được sách từ thư viện: " + error.message;
        }
        bookTickerStatus.hidden = false;
        console.error("Không thể tải sách cho trang chủ:", error);
    });

const landingSections = document.querySelectorAll(".landing-page section[id]");
const landingLinks = document.querySelectorAll(".nav-links a[href^='#']");

landingLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        landingLinks.forEach(function (item) {
            item.classList.toggle("active", item === link);
        });
    });
});

if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }

            landingLinks.forEach(function (link) {
                link.classList.toggle("active", link.hash === "#" + entry.target.id);
            });
        });
    }, { rootMargin: "-35% 0px -55% 0px" });

    landingSections.forEach(function (section) {
        sectionObserver.observe(section);
    });
}
