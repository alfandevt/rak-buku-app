const bookList = [];

const EVENTS = {
  RENDER_BOOKS: "RENDER_BOOKS",
};
const STORAGE_KEY = "BOOK_APP";

let editMode = false;
let searchMode = false;
let currentBookId = null;

document.addEventListener("DOMContentLoaded", () => {
  if (checkStorageCompat()) {
    loadFromStorage();
  }

  clearFormBook();
  clearSearch();

  document.dispatchEvent(
    new CustomEvent(EVENTS.RENDER_BOOKS, {
      detail: { bookList: bookList.slice() },
    })
  );

  const formBook = document.getElementById("form-book");
  formBook.addEventListener("submit", function (event) {
    event.preventDefault();
    saveBook();
    this.reset();
  });

  const formSearch = document.getElementById("search-form");
  formSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    const clearSearchBtn = document.getElementById("clear-search");
    clearSearchBtn.classList.remove("hide");

    const filteredBook = searchBook();
    document.dispatchEvent(
      new CustomEvent(EVENTS.RENDER_BOOKS, {
        detail: { bookList: filteredBook },
      })
    );
  });
});

document.addEventListener(EVENTS.RENDER_BOOKS, ({ detail: { bookList } }) => {
  const unreadBookList = document.getElementById("unread");
  unreadBookList.innerHTML = "";

  const readBookList = document.getElementById("read");
  readBookList.innerHTML = "";

  for (const bookObj of bookList) {
    const bookItemEl = createBook(bookObj);

    if (!bookObj.isComplete) {
      unreadBookList.append(bookItemEl);
    } else {
      readBookList.append(bookItemEl);
    }
  }
});

function createToast(text) {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.innerText = text;

  toastContainer.append(toast);

  let spawnToastTimer = setTimeout(() => {
    toast.classList.add("show");
    clearTimeout(spawnToastTimer);
  });

  let hideToastTimer = setTimeout(() => {
    toast.classList.remove("show");
    clearTimeout(hideToastTimer);
  }, 1500);

  let deleteToastTimer = setTimeout(() => {
    while (toastContainer.firstChild) {
      toastContainer.firstChild.remove();
    }
    clearTimeout(deleteToastTimer);
  }, 2000);
}

function generateId() {
  return +new Date() + Math.floor(Math.random() * 10);
}

function generateBookObj(id, title, author, year, isComplete) {
  return {
    id,
    title,
    author,
    year,
    isComplete,
  };
}

function findBookObj(bookId) {
  const bookIndex = findBookIndex(bookId);
  return bookList[bookIndex];
}

function findBookIndex(bookId) {
  return bookList.findIndex((book) => book.id == bookId);
}

function saveBook() {
  const title = document.getElementById("title").value;
  const year = +document.getElementById("year").value;
  const author = document.getElementById("author").value;
  const isComplete = document.getElementById("is-read").checked;

  if (!editMode) {
    const id = generateId();
    const book = generateBookObj(
      id,
      title.trim(),
      author.trim(),
      year,
      isComplete
    );
    bookList.push(book);
    createToast("Berhasil menambah buku");
  } else {
    const bookObj = findBookObj(currentBookId);
    bookObj.title = title;
    bookObj.year = year;
    bookObj.author = author;
    bookObj.isComplete = isComplete;
    createToast("Berhasil mengubah buku");
  }

  if (searchMode) {
    clearSearch();
  }

  document.dispatchEvent(
    new CustomEvent(EVENTS.RENDER_BOOKS, {
      detail: { bookList: bookList.slice() },
    })
  );
  clearFormBook();
  saveToStorage();
}

function removeBook(bookId) {
  const bookIndex = findBookIndex(bookId);
  if (bookIndex < 0) {
    return;
  }

  bookList.splice(bookIndex, 1);
  document.dispatchEvent(
    new CustomEvent(EVENTS.RENDER_BOOKS, {
      detail: { bookList: bookList.slice() },
    })
  );
  saveToStorage();
}

function moveBook(bookId) {
  const bookObj = findBookObj(bookId);
  if (!Boolean(bookObj)) {
    return;
  }

  bookObj.isComplete = !bookObj.isComplete;
  document.dispatchEvent(
    new CustomEvent(EVENTS.RENDER_BOOKS, {
      detail: { bookList: bookList.slice() },
    })
  );
  createToast("Berhasil memindahkan buku");
  saveToStorage();
}

function editBook(bookObj) {
  const title = document.getElementById("title");
  const author = document.getElementById("author");
  const year = document.getElementById("year");
  const isComplete = document.getElementById("is-read");
  const btnCancel = document.getElementById("cancel-edit");
  btnCancel.classList.remove("hide");

  currentBookId = bookObj.id;
  title.value = bookObj.title;
  author.value = bookObj.author;
  year.value = +bookObj.year;
  isComplete.checked = bookObj.isComplete;
  editMode = true;
  window.scrollTo(0, 0);
}

function clearFormBook() {
  const btnCancel = document.getElementById("cancel-edit");
  const formBook = document.getElementById("form-book");
  btnCancel.classList.add("hide");

  if (searchMode) {
    clearSearch();
  }

  formBook.reset();
  editMode = false;
}

function searchBook() {
  const inputSearch = document.getElementById("search").value;
  searchMode = true;
  return bookList.slice().filter((book) => {
    return book.title.toLowerCase().includes(inputSearch.toLowerCase());
  });
}

function clearSearch() {
  const formSearch = document.getElementById("search-form");
  const clearSearchBtn = document.getElementById("clear-search");
  clearSearchBtn.classList.add("hide");
  formSearch.reset();
  searchMode = false;

  document.dispatchEvent(
    new CustomEvent(EVENTS.RENDER_BOOKS, {
      detail: { bookList: bookList.slice() },
    })
  );
}

function checkStorageCompat() {
  if (typeof Storage === undefined) {
    alert("Browser ini tidak mendukung local storage");
    return false;
  }
  return true;
}

function saveToStorage() {
  if (checkStorageCompat()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookList));
    document.dispatchEvent(new Event(EVENTS.SAVED_BOOK));
  }
}

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  const parsedData = JSON.parse(data);

  if (parsedData) {
    for (const book of parsedData) {
      bookList.push(book);
    }
  }
  document.dispatchEvent(
    new CustomEvent(EVENTS.RENDER_BOOKS, {
      detail: { bookList: bookList.slice() },
    })
  );
}

function createBook(bookObj) {
  const titleText = document.createElement("h3");
  titleText.innerHTML = bookObj.title;

  const authorText = document.createElement("p");
  authorText.innerText = bookObj.author;

  const yearText = document.createElement("p");
  yearText.innerText = bookObj.year;

  const bookArticle = document.createElement("article");
  bookArticle.classList.add("book");
  bookArticle.append(titleText, authorText, yearText);

  const listItem = document.createElement("li");
  listItem.setAttribute("id", `book-${bookObj.id}`);
  listItem.append(bookArticle);

  const faEdit = document.createElement("i");
  faEdit.classList.add("fas", "fa-edit");
  const editBtn = document.createElement("button");
  editBtn.classList.add("btn-edit");
  editBtn.append(faEdit);
  editBtn.addEventListener("click", () => {
    editBook(bookObj);
  });

  const faTrash = document.createElement("i");
  faTrash.classList.add("fas", "fa-trash");
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("btn-trash");
  deleteBtn.append(faTrash);
  deleteBtn.addEventListener("click", () => {
    removeBook(bookObj.id);
  });

  if (bookObj.isComplete) {
    const undoBtn = document.createElement("button");
    undoBtn.classList.add("btn-success");
    undoBtn.innerText = "Belum selesai dibaca";
    undoBtn.addEventListener("click", () => {
      moveBook(bookObj.id);
    });

    bookArticle.append(undoBtn);
  } else {
    const completeBtn = document.createElement("button");
    completeBtn.classList.add("btn-success");
    completeBtn.innerText = "Selesai dibaca";
    completeBtn.addEventListener("click", () => {
      moveBook(bookObj.id);
    });

    bookArticle.append(completeBtn);
  }
  bookArticle.append(deleteBtn, editBtn);

  return listItem;
}
