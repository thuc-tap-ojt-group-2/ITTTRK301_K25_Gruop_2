// Trang chủ: trạng thái đăng nhập, hiện dần khi cuộn, số tự nhảy, sách trượt qua rồi quay lại
document.documentElement.classList.add("js");


/* ---------- 1. Thanh điều hướng theo trạng thái đăng nhập ---------- */
if (PTIT.isLoggedIn()) {
    const actions = document.getElementById("navActions");

    actions.innerHTML =
        '<a class="btn btn-primary" href="books.html" data-go="forward">Vào hệ thống</a>' +
        '<button class="btn btn-outline" id="navLogout" type="button">Đăng xuất</button>';

    document.getElementById("navLogout").addEventListener("click", PTIT.logout);
    PTIT.bindLinks();
}


/* ---------- 2. Hiện dần khi cuộn tới, tô sáng mục menu đang xem ---------- */
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("main section[id]");
const menuLinks = document.querySelectorAll(".nav-links a");

if ("IntersectionObserver" in window) {
    const revealer = new IntersectionObserver(function (entries) {
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                entries[i].target.classList.add("in");
                revealer.unobserve(entries[i].target);
            }
        }
    }, { threshold: 0.12 });

    for (let i = 0; i < revealItems.length; i++) {
        revealer.observe(revealItems[i]);
    }

    const spy = new IntersectionObserver(function (entries) {
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                for (let j = 0; j < menuLinks.length; j++) {
                    menuLinks[j].classList.toggle("active", menuLinks[j].getAttribute("href") === "#" + entries[i].target.id);
                }
            }
        }
    }, { rootMargin: "-45% 0px -50% 0px" });

    for (let i = 0; i < sections.length; i++) {
        spy.observe(sections[i]);
    }
} else {
    for (let i = 0; i < revealItems.length; i++) {
        revealItems[i].classList.add("in");
    }
}


/* ---------- 3. Cảnh nền trong phần đầu trang ---------- */
PTIT.addScene(document.getElementById("home"));


/* ---------- 4. Số liệu thật từ Backend và dải sách mới ---------- */
const track = document.getElementById("track");
const tickerNote = document.getElementById("tickerNote");
const colors = ["#0b6e4f", "#17679a", "#b7852f", "#6a4c93", "#c0392b", "#2f9e6d", "#34495e", "#d35400"];

// Sách mẫu hiện khi Backend chưa chạy
const sampleBooks = [
    { title: "Cấu trúc dữ liệu và giải thuật", author: "Nguyễn Bá Minh Đạo" },
    { title: "Clean Code - Mã sạch", author: "Robert C. Martin" },
    { title: "Lập trình hướng đối tượng Python", author: "Phan Ngọc Tài" },
    { title: "Hệ quản trị cơ sở dữ liệu MySQL", author: "Lê Hà Thanh Sang" },
    { title: "Scrum: The Art of Doing Twice the Work", author: "Jeff Sutherland" }
];

function renderTicker(list) {
    track.innerHTML = "";

    for (let i = 0; i < list.length; i++) {
        const book = list[i];
        const card = document.createElement("div");
        const title = document.createElement("b");
        const author = document.createElement("small");
        const cover = book.imageUrl || book.image_url;

        card.className = "bk";
        card.style.setProperty("--c", colors[i % colors.length]);

        if (cover) {
            card.style.backgroundImage = 'url("' + String(cover).replace(/"/g, "%22") + '")';
        }

        title.textContent = book.title;
        author.textContent = book.author;
        card.append(title, author);
        track.appendChild(card);
    }
}

// Trượt tới cuối rồi quay lại đầu, rê chuột vào thì dừng
let tickerIndex = 0;
let tickerDirection = 1;
let tickerHold = false;

function startTicker() {
    if (PTIT.reduceMotion) {
        return;
    }

    track.parentElement.addEventListener("mouseenter", function () { tickerHold = true; });
    track.parentElement.addEventListener("mouseleave", function () { tickerHold = false; });

    setInterval(function () {
        if (tickerHold || track.children.length === 0) {
            return;
        }

        const viewWidth = track.parentElement.clientWidth;
        const totalWidth = track.scrollWidth;
        const step = track.children[0].offsetWidth + 16;
        const maxIndex = Math.ceil((totalWidth - viewWidth) / step);

        if (maxIndex < 1) {
            return;
        }

        if (tickerIndex >= maxIndex) {
            tickerDirection = -1;
        } else if (tickerIndex <= 0) {
            tickerDirection = 1;
        }

        tickerIndex += tickerDirection;
        track.style.transform = "translateX(-" + Math.min(tickerIndex * step, totalWidth - viewWidth) + "px)";
    }, 2800);
}

PTIT.loadStats(function (stats) {
    PTIT.fillStats(stats);

    if (stats && stats.books.length > 0) {
        renderTicker(stats.books.slice().reverse().slice(0, 10));
    } else {
        renderTicker(sampleBooks);
        tickerNote.textContent = "Chưa kết nối được Backend nên đang hiển thị sách mẫu.";
        tickerNote.hidden = false;
    }

    startTicker();
});

<<<<<<< HEAD
document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  if (pass.length < 6) {
    regError.textContent = 'Mật khẩu cần có ít nhất 6 ký tự.';
  } else if (pass !== pass2) {
    regError.textContent = 'Mật khẩu nhập lại chưa khớp.';
  } else {
    regError.textContent = '';
  }
});
=======

/* ---------- 5. Biểu mẫu liên hệ (chưa có API nên chỉ báo đã nhận) ---------- */
document.getElementById("contactForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const ok = document.getElementById("contactOk");
    const button = document.getElementById("contactBtn");

    if (document.getElementById("cName").value.trim() === "" ||
        document.getElementById("cEmail").value.trim() === "" ||
        document.getElementById("cMsg").value.trim() === "") {
        ok.style.color = "#c0392b";
        ok.textContent = "Vui lòng nhập đủ họ tên, email và nội dung.";
        return;
    }

    ok.textContent = "";
    button.classList.add("is-loading");

    setTimeout(function () {
        button.classList.remove("is-loading");
        ok.style.color = "";
        ok.textContent = "Cảm ơn bạn! Thủ thư sẽ phản hồi qua email.";
        event.target.reset();
    }, 900);
});
>>>>>>> origin/main
