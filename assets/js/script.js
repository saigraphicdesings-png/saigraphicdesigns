"use strict";

/* ================================
   SIDEBAR CONTACT TOGGLE
================================ */

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn && sidebar) {
  sidebarBtn.addEventListener("click", function () {
    sidebar.classList.toggle("active");
  });
}


/* ================================
   PAGE NAVIGATION
================================ */

const navLinks = document.querySelectorAll(".navbar-link[data-nav-link]");
const pages = document.querySelectorAll("article[data-page]");

console.log("NAV LINKS:", navLinks.length);
console.log("PAGES:", pages.length);

navLinks.forEach(function (link) {

  link.addEventListener("click", function (event) {

    event.preventDefault();

    const pageName = this.dataset.navLink;

    console.log("CLICKED:", pageName);

    navLinks.forEach(function (nav) {
      nav.classList.remove("active");
    });

    pages.forEach(function (page) {
      page.classList.remove("active");
    });

    this.classList.add("active");

    const selectedPage = document.querySelector(
      'article[data-page="' + pageName + '"]'
    );

    console.log("SELECTED PAGE:", selectedPage);

    if (selectedPage) {
      selectedPage.classList.add("active");
      console.log("OPENED:", pageName);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});


/* ================================
   PORTFOLIO FILTER
================================ */

const filterButtons = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

filterButtons.forEach(function (button) {

  button.addEventListener("click", function () {

    const selectedCategory = this.textContent
      .trim()
      .toLowerCase();

    /* Remove active from all filter buttons */

    filterButtons.forEach(function (btn) {
      btn.classList.remove("active");
    });

    /* Add active to selected filter */

    this.classList.add("active");

    /* Filter projects */

    filterItems.forEach(function (item) {

      const itemCategory = item.dataset.category;

      if (
        selectedCategory === "all" ||
        selectedCategory === itemCategory
      ) {

        item.classList.add("active");

      } else {

        item.classList.remove("active");

      }

    });

  });

});


/* ================================
   MOBILE PORTFOLIO FILTER
================================ */

const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");

if (select) {

  select.addEventListener("click", function () {
    select.classList.toggle("active");
  });

}


selectItems.forEach(function (item) {

  item.addEventListener("click", function () {

    const selectedValue = this.textContent.trim();

    /* Change selected value */

    if (selectValue) {
      selectValue.textContent = selectedValue;
    }

    /* Close dropdown */

    if (select) {
      select.classList.remove("active");
    }

    const selectedCategory = selectedValue.toLowerCase();

    /* Filter projects */

    filterItems.forEach(function (project) {

      const category = project.dataset.category;

      if (
        selectedCategory === "all" ||
        category === selectedCategory
      ) {

        project.classList.add("active");

      } else {

        project.classList.remove("active");

      }

    });

  });

});


/* ================================
   CONTACT FORM
================================ */

const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formButton = document.querySelector("[data-form-btn]");

if (form && formButton) {

  formInputs.forEach(function (input) {

    input.addEventListener("input", function () {

      if (form.checkValidity()) {

        formButton.removeAttribute("disabled");

      } else {

        formButton.setAttribute("disabled", "");

      }

    });

  });

  form.addEventListener("submit", function (event) {

    event.preventDefault();

    alert("Thank you! Your message has been received.");

  });

}
