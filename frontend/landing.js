/**
 * ====================================================================
 * THƯ VIỆN PTIT - LANDING PAGE SCRIPT
 * landing.js: Xử lý dữ liệu sách nổi bật từ backend, skeleton shimmer,
 *             bìa dự phòng CSS gradient 6 màu, trạng thái lỗi máy chủ (error state),
 *             nút Thử lại, chuẩn hóa URL ảnh tương đối, và số nhảy thống kê thực tế.
 * ====================================================================
 */

const bookTrack = document.getElementById("bookTrack");
const bookTickerStatus = document.getElementById("bookTickerStatus");
const bookCarousel = document.getElementById("bookCarousel");
const homeStatsStatus = document.getElementById("homeStatsStatus");

/**
 * Bảng 6 màu gradient chuẩn mực theo từng nhóm thể loại:
 * 1. Xanh lá: Giáo trình, CNTT, Khoa học, Lập trình
 * 2. Xanh dương đậm: Viễn thông, Kỹ thuật, Mạng, Điện tử
 * 3. Vàng đất: Kinh tế, Quản trị, Khởi nghiệp, Tài chính
 * 4. Đỏ rượu: Văn học, Tiểu thuyết, Lịch sử, Văn hóa
 * 5. Tím than: An toàn thông tin, Mật mã, Triết học
 * 6. Xanh ngọc: Khám phá, Thiên văn, Tự nhiên, Môi trường
 */
const CATEGORY_GRADIENTS = {
    green: "linear-gradient(145deg, #137547 0%, #0A4331 100%)",
    navy: "linear-gradient(145deg, #1F4E79 0%, #102A43 100%)",
    amber: "linear-gradient(145deg, #C88A2E 0%, #7D5110 100%)",
    wine: "linear-gradient(145deg, #9E2A2B 0%, #541314 100%)",
    purple: "linear-gradient(145deg, #5A3D7A 0%, #2A1740 100%)",
    teal: "linear-gradient(145deg, #028090 0%, #00434E 100%)"
};

const GRADIENT_PALETTE = [
    CATEGORY_GRADIENTS.green,
    CATEGORY_GRADIENTS.navy,
    CATEGORY_GRADIENTS.amber,
    CATEGORY_GRADIENTS.wine,
    CATEGORY_GRADIENTS.purple,
    CATEGORY_GRADIENTS.teal
];

/**
 * Lấy màu gradient đại diện cho thể loại sách
 */
function getCategoryGradient(categoryName, index) {
    if (!categoryName) return GRADIENT_PALETTE[index % GRADIENT_PALETTE.length];
    const cat = categoryName.toLowerCase();
    if (cat.includes("công nghệ") || cat.includes("cntt") || cat.includes("giáo") || cat.includes("lập trình") || cat.includes("phần mềm")) {
        return CATEGORY_GRADIENTS.green;
    }
    if (cat.includes("viễn thông") || cat.includes("điện tử") || cat.includes("mạng") || cat.includes("kỹ thuật")) {
        return CATEGORY_GRADIENTS.navy;
    }
    if (cat.includes("kinh tế") || cat.includes("tài chính") || cat.includes("khởi nghiệp") || cat.includes("quản trị")) {
        return CATEGORY_GRADIENTS.amber;
    }
    if (cat.includes("tiểu thuyết") || cat.includes("văn học") || cat.includes("lịch sử") || cat.includes("văn hóa")) {
        return CATEGORY_GRADIENTS.wine;
    }
    if (cat.includes("an toàn") || cat.includes("attt") || cat.includes("bảo mật") || cat.includes("triết học")) {
        return CATEGORY_GRADIENTS.purple;
    }
    if (cat.includes("khám phá") || cat.includes("thiên văn") || cat.includes("tự nhiên") || cat.includes("khoa học")) {
        return CATEGORY_GRADIENTS.teal;
    }
    return GRADIENT_PALETTE[index % GRADIENT_PALETTE.length];
}

function resolveLandingCoverUrl(rawUrl) {
    let cleanUrl = String(rawUrl || "").trim();
    if (!cleanUrl) return "";
    if (cleanUrl.startsWith("/covers/") || cleanUrl.startsWith("covers/")) {
        return "./" + cleanUrl.replace(/^\/+/, "");
    }
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && !cleanUrl.startsWith("//")) {
        return homepageApiBaseUrl + (cleanUrl.startsWith("/") ? "" : "/") + cleanUrl;
    }
    return cleanUrl;
}

/**
 * Hiển thị 3 cuốn sách nổi bật ở khu vực Hero (CNTT, ATTT, Viễn thông)
 * Lấy ảnh bìa và thông tin trực tiếp từ Database qua API /api/books
 */
function renderHeroBooks(books) {
    if (!Array.isArray(books) || books.length === 0) return;

    // Lọc theo 3 chuyên ngành tiêu biểu của PTIT
    const cnttBook = books.find(b => {
        const text = `${b.title || ""} ${b.categoryName || ""}`.toLowerCase();
        return text.includes("thuật") || text.includes("lập trình") || text.includes("clean code") || text.includes("thông tin");
    }) || books[0];

    const atttBook = books.find(b => {
        const text = `${b.title || ""} ${b.categoryName || ""}`.toLowerCase();
        return b !== cnttBook && (text.includes("cơ sở dữ liệu") || text.includes("an toàn") || text.includes("mạng") || text.includes("python"));
    }) || books[1] || books[0];

    const vtBook = books.find(b => {
        const text = `${b.title || ""} ${b.categoryName || ""}`.toLowerCase();
        return b !== cnttBook && b !== atttBook && (text.includes("viễn thông") || text.includes("không dây") || text.includes("thiên văn") || text.includes("khám phá"));
    }) || books[2] || books[0];

    const heroConfig = [
        { id: "hero-book-1", badge: "CNTT", book: cnttBook },
        { id: "hero-book-2", badge: "ATTT", book: atttBook },
        { id: "hero-book-3", badge: "VIỄN THÔNG", book: vtBook }
    ];

    heroConfig.forEach(function (item) {
        const el = document.getElementById(item.id);
        if (!el || !item.book) return;

        const titleEl = el.querySelector(".hero-book-title");
        const authorEl = el.querySelector(".hero-book-author");
        const badgeEl = el.querySelector(".hero-book-badge");
        const imgEl = el.querySelector(".hero-book-img");

        if (titleEl) titleEl.textContent = item.book.title || "Sách học tập PTIT";
        if (authorEl) authorEl.textContent = item.book.author || "Học viện PTIT";
        if (badgeEl) badgeEl.textContent = item.badge;

        if (imgEl && (item.book.imageUrl || item.book.image_url)) {
            imgEl.hidden = true;
            const cleanUrl = resolveLandingCoverUrl(item.book.imageUrl || item.book.image_url);
            imgEl.referrerPolicy = "no-referrer";
            imgEl.loading = "lazy";
            imgEl.src = cleanUrl;
            imgEl.hidden = false;
            imgEl.onerror = function () {
                imgEl.hidden = true;
            };
        }

        // Cập nhật aria-label
        el.setAttribute("aria-label", [item.book.title, item.book.author].filter(Boolean).join(" — "));
    });
}

/**
 * Hiển thị 6 thẻ khung xương (Skeleton Shimmer) trong khi chờ dữ liệu API
 */
function renderSkeletonCards() {
    if (!bookTrack) return;
    bookTrack.replaceChildren();

    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "skeleton-card";
        skeleton.setAttribute("aria-hidden", "true");
        skeleton.innerHTML = `
            <div class="skeleton-cover skeleton-shimmer"></div>
            <div class="skeleton-line skeleton-shimmer skeleton-line--wide"></div>
            <div class="skeleton-line skeleton-shimmer skeleton-line--narrow"></div>
        `;
        bookTrack.appendChild(skeleton);
    }
}

/**
 * Tạo bìa sách dự phòng CSS gradient đa dạng chuẩn thiết kế:
 * - Họa tiết gáy sách bằng CSS bên mép trái
 * - Gradient riêng biệt theo thể loại trong bảng 6 màu hài hòa
 * - Tên sách chữ trắng căn giữa tối đa 3 dòng (line-clamp)
 * - Tên tác giả nhỏ bên dưới, phân cách rõ ràng, không bao giờ chồng chữ
 */
function createFallbackCover(bookTitle, categoryName, authorName, gradient) {
    const fallback = document.createElement("div");
    fallback.className = "featured-book-fallback";
    const category = String(categoryName || "").toLowerCase();
    const tone =
        category.includes("công nghệ") || category.includes("cntt") || category.includes("giáo") || category.includes("lập trình") ? "green" :
        category.includes("viễn thông") || category.includes("điện tử") || category.includes("mạng") || category.includes("kỹ thuật") ? "navy" :
        category.includes("kinh tế") || category.includes("tài chính") || category.includes("khởi nghiệp") || category.includes("quản trị") ? "amber" :
        category.includes("tiểu thuyết") || category.includes("văn học") || category.includes("lịch sử") || category.includes("văn hóa") ? "wine" :
        category.includes("an toàn") || category.includes("attt") || category.includes("bảo mật") || category.includes("triết học") ? "purple" :
        "teal";
    fallback.classList.add("featured-book-fallback--" + tone);

    // 1. Nhãn thể loại ở trên cùng
    const tag = document.createElement("span");
    tag.className = "featured-book-fallback-tag";
    tag.textContent = categoryName || "Giáo trình PTIT";

    // 2. Icon sách SVG thanh lịch ở giữa
    const icon = document.createElement("div");
    icon.className = "featured-book-fallback-icon";
    icon.innerHTML = `
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
    `;

    // 3. Tên sách chữ trắng căn giữa tối đa 3 dòng
    const titleEl = document.createElement("strong");
    titleEl.className = "featured-book-fallback-title";
    titleEl.textContent = bookTitle || "Tài liệu học tập PTIT";

    // 4. Tên tác giả nhỏ bên dưới
    const authorEl = document.createElement("div");
    authorEl.className = "featured-book-fallback-author";
    authorEl.textContent = authorName || "Học viện PTIT";

    // 5. Dấu hiệu thương hiệu Thư viện PTIT
    const mark = document.createElement("div");
    mark.className = "featured-book-fallback-mark";
    mark.innerHTML = '<span aria-hidden="true">✦</span> Thư viện PTIT';

    fallback.append(tag, icon, titleEl, authorEl, mark);
    return fallback;
}

/**
 * Tạo card sách chuẩn UI/UX:
 * - Ảnh bìa aspect-ratio 2/3, bo góc 12px
 * - Kiểm tra ảnh thật từ API: hiển thị ảnh thật khi có, tự ẩn fallback
 * - Tên sách và tác giả luôn nằm DƯỚI ảnh (không đè lên ảnh)
 * - Hover nâng 6px và bóng đổ mượt
 */
function createBookCard(book, index) {
    const card = document.createElement("article");
    card.className = "featured-book-card ticker-book tilt-enabled";
    card.setAttribute("aria-label", [book.title, book.author].filter(Boolean).join(" — "));
    card.tabIndex = 0;

    // Mở modal chi tiết sách khi click hoặc nhấn Enter
    card.addEventListener("click", function () {
        if (typeof openBookDetail === "function") {
            openBookDetail(book);
        } else {
            const openBtn = document.querySelector('[data-open="login"]');
            if (openBtn) openBtn.click();
        }
    });
    card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            card.click();
        }
    });

    const categoryName = book.categoryName || book.category_name || "Tài liệu PTIT";
    const bookTitle = book.title || "Tài liệu học tập PTIT";
    const bookAuthor = book.author || "Học viện PTIT";
    const gradient = getCategoryGradient(categoryName, index);

    // 1. Khung bìa sách (aspect-ratio 2/3)
    const coverWrapper = document.createElement("div");
    coverWrapper.className = "featured-book-cover";

    // Tạo sẵn bìa dự phòng đa dạng màu sắc
    const fallbackCover = createFallbackCover(bookTitle, categoryName, bookAuthor, gradient);
    coverWrapper.appendChild(fallbackCover);

    // Kiểm tra và hiển thị ảnh thật từ API nếu có
    const rawImageUrl = typeof book.imageUrl === "string" ? book.imageUrl : book.image_url;

    if (typeof rawImageUrl === "string" && rawImageUrl.trim().length > 0) {
        const cleanUrl = resolveLandingCoverUrl(rawImageUrl);

        const image = document.createElement("img");
        image.className = "featured-book-img";
        image.alt = bookTitle;
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        image.hidden = true;

        image.onload = function () {
            image.hidden = false;
            if (fallbackCover.parentNode) {
                fallbackCover.hidden = true;
            }
        };

        image.onerror = function () {
            image.remove();
            fallbackCover.hidden = false;
        };

        image.src = cleanUrl;
        coverWrapper.appendChild(image);
    }

    // 2. Khối thông tin đặt DƯỚI ảnh bìa (không đè lên ảnh)
    const info = document.createElement("div");
    info.className = "featured-book-info";

    const catEl = document.createElement("span");
    catEl.className = "featured-book-cat ticker-book-category";
    catEl.textContent = categoryName;

    const titleEl = document.createElement("strong");
    titleEl.className = "featured-book-title ticker-book-title";
    titleEl.textContent = bookTitle;

    const authorEl = document.createElement("p");
    authorEl.className = "featured-book-author ticker-book-author";
    authorEl.textContent = bookAuthor;

    info.append(catEl, titleEl, authorEl);

    // Nút hành động ở đáy card để đồng đều chiều cao tất cả card
    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "featured-book-action";
    actionBtn.textContent = "Xem chi tiết";
    actionBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (typeof openBookDetail === "function") {
            openBookDetail(book);
        } else {
            const openBtn = document.querySelector('[data-open="login"]');
            if (openBtn) openBtn.click();
        }
    });

    info.appendChild(actionBtn);
    card.append(coverWrapper, info);

    return card;
}

/**
 * Hiển thị tối đa 6 cuốn sách trong lưới sách nổi bật
 */
function renderBookTicker(books) {
    if (!bookTrack) return;
    bookTrack.replaceChildren();

    if (!Array.isArray(books) || books.length === 0) {
        renderEmptyState("Hiện chưa có cuốn sách nào trong danh mục.");
        return;
    }

    const displayList = books.slice(0, 6);
    displayList.forEach(function (book, index) {
        const card = createBookCard(book, index);
        if (card) {
            bookTrack.appendChild(card);
        }
    });

    if (bookTickerStatus) {
        bookTickerStatus.hidden = true;
    }

    // Kích hoạt hiệu ứng 3D Tilt cho các card mới
    if (window.PTIT_EFFECTS && typeof window.PTIT_EFFECTS.initTilt === "function") {
        window.PTIT_EFFECTS.initTilt();
    }
}

/**
 * Hiển thị giao diện thông báo lỗi máy chủ kèm nút Thử lại (Không che giấu bằng số ảo)
 */
function renderErrorState(errorMessage) {
    if (!bookTrack) return;
    bookTrack.replaceChildren();

    const errorContainer = document.createElement("div");
    errorContainer.className = "homepage-error-state";
    errorContainer.setAttribute("role", "alert");
    errorContainer.innerHTML = `
        <div class="homepage-error-icon" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        </div>
        <p class="homepage-error-title">Không tải được dữ liệu từ hệ thống</p>
        <p class="homepage-error-detail">${errorMessage || "Vui lòng kiểm tra trạng thái máy chủ backend."}</p>
        <button type="button" class="btn btn--secondary btn-retry" id="btnRetryHomepage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Thử lại
        </button>
    `;

    bookTrack.appendChild(errorContainer);

    const retryBtn = errorContainer.querySelector("#btnRetryHomepage");
    if (retryBtn) {
        retryBtn.addEventListener("click", function () {
            loadHomepageData();
        });
    }

    if (bookTickerStatus) {
        bookTickerStatus.hidden = true;
    }
}

/**
 * Hiển thị trạng thái danh mục trống
 */
function renderEmptyState(message) {
    if (!bookTrack) return;
    bookTrack.replaceChildren();

    const emptyContainer = document.createElement("div");
    emptyContainer.className = "homepage-error-state";
    emptyContainer.innerHTML = `
        <p class="homepage-error-title">${message || "Hiện chưa có dữ liệu sách."}</p>
    `;
    bookTrack.appendChild(emptyContainer);
}

/**
 * Đặt lại các chỉ số thống kê về dạng gạch ngang "—"
 */
function resetHomepageStats() {
    document.querySelectorAll("[data-home-stat]").forEach(function (element) {
        element.textContent = "—";
        element.removeAttribute("data-target");
    });
}

/**
 * Cập nhật số liệu thống kê thư viện và kích hoạt số nhảy khi API trả về thành công
 */
function renderHomepageStats(response) {
    const stats = {
        titles: Number(response.total_titles),
        copies: Number(response.total_copies),
        categories: Number(response.total_categories)
    };

    if (Object.values(stats).some(function (value) {
        return !Number.isFinite(value) || value < 0;
    })) {
        throw new Error("Dữ liệu thống kê từ máy chủ không hợp lệ.");
    }

    document.querySelectorAll("[data-home-stat]").forEach(function (element) {
        const statKey = element.dataset.homeStat;
        if (stats[statKey] !== undefined) {
            const targetVal = Number(stats[statKey]);
            element.setAttribute("data-target", targetVal);

            if (window.PTIT_EFFECTS && typeof window.PTIT_EFFECTS.animateValue === "function") {
                window.PTIT_EFFECTS.animateValue(element, 0, targetVal, 1200);
            } else {
                element.textContent = targetVal.toLocaleString("vi-VN");
            }
        }
    });

    if (homeStatsStatus) {
        homeStatsStatus.textContent = "Số liệu thống kê được đồng bộ trực tiếp từ hệ thống thư viện";
    }
}

// API endpoint kết nối backend
const homepageApiBaseUrl = (
    window.PTIT_API_BASE_URL ||
    (window.location.protocol === "https:" ? "https:" : "http:") +
        "//" + (window.location.hostname || "127.0.0.1") + ":8000"
).replace(/\/+$/, "");

/**
 * Tải dữ liệu trang chủ từ backend
 */
function loadHomepageData() {
    // 1. Hiển thị skeleton và đặt lại thống kê về "—"
    renderSkeletonCards();
    resetHomepageStats();

    if (homeStatsStatus) {
        homeStatsStatus.textContent = "Đang đồng bộ số liệu từ máy chủ thư viện…";
    }

    const statsUrl = homepageApiBaseUrl + "/api/stats/public";
    fetch(statsUrl)
        .then(async function (response) {
            let payload = null;
            try {
                payload = await response.json();
            } catch {
                // Invalid JSON is reported as a failed public-statistics request.
            }

            if (!response.ok || !payload) {
                throw new Error("Không thể tải thống kê công khai từ hệ thống.");
            }
            return payload;
        })
        .then(renderHomepageStats)
        .catch(function (error) {
            resetHomepageStats();
            if (homeStatsStatus) {
                homeStatsStatus.textContent = "Không thể tải số liệu từ hệ thống. Vui lòng thử tải lại trang.";
            }
            console.error("Không thể tải thống kê công khai:", error.message);
        });

    const endpointUrl = homepageApiBaseUrl + "/api/books?page=1&size=10";

    fetch(endpointUrl)
        .then(async function (response) {
            let payload = null;
            try {
                payload = await response.json();
            } catch {
                // Nếu không phân tích được JSON từ phản hồi
            }

            if (!response.ok) {
                const detail = payload && (payload.detail || payload.message);
                const errorInfo = {
                    url: endpointUrl,
                    status: response.status,
                    statusText: response.statusText,
                    detail: detail
                };
                console.error("Lỗi phản hồi từ API Thư viện PTIT:", errorInfo);
                const errorMsg = typeof detail === "string" 
                    ? detail 
                    : `Máy chủ phản hồi mã lỗi HTTP ${response.status} (${response.statusText || "Lỗi yêu cầu"}).`;
                throw new Error(errorMsg);
            }

            if (!payload) {
                throw new Error("Phản hồi rỗng hoặc không đúng định dạng JSON.");
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
                throw new Error("Cấu trúc danh sách sách không đúng định dạng chuẩn.");
            }

            // Hiển thị sách và số liệu thống kê thực tế
            renderBookTicker(books);
            renderHeroBooks(books);
            const openBookId = new URLSearchParams(window.location.search).get("openBook");
            if (openBookId && typeof openBookDetail === "function") {
                const selectedBook = books.find(function (book) {
                    return String(book.id) === String(openBookId);
                });
                if (selectedBook) {
                    openBookDetail(selectedBook);
                } else {
                    fetch(homepageApiBaseUrl + "/api/books?page=1&size=100")
                        .then(res => res.ok ? res.json() : null)
                        .then(fullPayload => {
                            const list = fullPayload?.content || fullPayload?.items || [];
                            const found = list.find(item => String(item.id) === String(openBookId));
                            if (found) openBookDetail(found);
                        })
                        .catch(() => {});
                }
            }
        })
        .catch(function (error) {
            document.dispatchEvent(new CustomEvent("ptit:api-error", {
                detail: { url: endpointUrl, message: error.message }
            }));
            console.error("Không thể kết nối đến API Thư viện PTIT:", {
                url: endpointUrl,
                message: error.message
            });

            // Hiển thị trạng thái lỗi rõ ràng, KHÔNG dùng số ảo hay dữ liệu giả
            renderErrorState(error.message);

            if (homeStatsStatus) {
                homeStatsStatus.textContent = "Không thể tải số liệu từ hệ thống. Vui lòng kiểm tra kết nối máy chủ.";
            }
        });
}

// Bắt đầu tải dữ liệu khi trang sẵn sàng
loadHomepageData();

const heroSearchForm = document.getElementById("heroSearchForm");
if (heroSearchForm) {
    heroSearchForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const input = document.getElementById("heroSearchInput");
        const typeSelect = document.getElementById("heroSearchType");
        const query = input ? input.value.trim() : "";
        const searchType = typeSelect ? typeSelect.value : "title";

        if (!query) {
            if (input) input.focus();
            loadHomepageData();
            return;
        }

        const appViewEl = document.getElementById("appView");
        if (appViewEl && !appViewEl.hidden && typeof navigate === "function" && typeof applySearch === "function") {
            const readerSearch = document.getElementById("searchInput");
            if (readerSearch) readerSearch.value = query;
            navigate("search");
            applySearch(query);
            return;
        }

        renderSkeletonCards();
        const featuredSection = document.getElementById("featured-books");
        if (featuredSection) {
            featuredSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        try {
            const params = new URLSearchParams({ page: 1, size: 100, keyword: query });
            const res = await fetch(`${homepageApiBaseUrl}/api/books?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const payload = await res.json();
            let list = Array.isArray(payload) ? payload : (payload.content || payload.items || []);

            const qLower = query.toLowerCase();
            if (searchType === "author") {
                const authorMatches = list.filter(b => String(b.author || "").toLowerCase().includes(qLower));
                if (authorMatches.length) list = authorMatches;
            } else if (searchType === "isbn") {
                const isbnMatches = list.filter(b => String(b.isbn || "").toLowerCase().includes(qLower) || String(b.id) === query);
                if (isbnMatches.length) list = isbnMatches;
            }

            if (list.length === 0) {
                renderEmptyState(`Không tìm thấy sách phù hợp với từ khóa "${query}".`);
            } else {
                renderBookTicker(list);
            }
        } catch (error) {
            renderErrorState(error.message || "Không thể tìm kiếm sách.");
        }
    });
}

// Xử lý Active link khi cuộn trang
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
