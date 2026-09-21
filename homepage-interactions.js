document.addEventListener("DOMContentLoaded", function () {
            const faqQuestions = document.querySelectorAll("#faq .faq-question");

            faqQuestions.forEach(function (question) {
                question.addEventListener("click", function () {
                    const item = question.closest(".faq-item");
                    const isActive = item.classList.contains("active");

                    document.querySelectorAll("#faq .faq-item").forEach(function (otherItem) {
                        otherItem.classList.remove("active");
                        const otherQuestion = otherItem.querySelector(".faq-question");
                        if (otherQuestion) {
                            otherQuestion.setAttribute("aria-expanded", "false");
                        }
                    });

                    if (!isActive) {
                        item.classList.add("active");
                        question.setAttribute("aria-expanded", "true");
                    }
                });
            });
        });

document.addEventListener("DOMContentLoaded", function () {
            const statCard = document.querySelector(".hero-stat-card");
            const statNumber = statCard
                ? statCard.querySelector(".hero-stat-num")
                : null;

            if (!statCard || !statNumber) {
                return;
            }

            const target = Number(statNumber.dataset.target) || 100;
            const reducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;
            let hasAnimated = false;

            statCard.classList.add("stat-animation-ready");

            function startStatAnimation() {
                if (hasAnimated) {
                    return;
                }

                hasAnimated = true;
                statCard.classList.add("is-visible");

                if (reducedMotion) {
                    statNumber.textContent = target + "+";
                    return;
                }

                statNumber.textContent = "0+";
                statNumber.classList.add("is-counting");

                const duration = 1400;
                const startTime = performance.now();

                function updateNumber(currentTime) {
                    const progress = Math.min(
                        (currentTime - startTime) / duration,
                        1
                    );
                    const easedProgress = 1 - Math.pow(1 - progress, 3);
                    const currentValue = Math.round(target * easedProgress);

                    statNumber.textContent = currentValue + "+";

                    if (progress < 1) {
                        requestAnimationFrame(updateNumber);
                    } else {
                        statNumber.textContent = target + "+";
                        window.setTimeout(function () {
                            statNumber.classList.remove("is-counting");
                            statCard.classList.add("is-floating");
                        }, 250);
                    }
                }

                requestAnimationFrame(updateNumber);
            }

            if ("IntersectionObserver" in window) {
                const observer = new IntersectionObserver(
                    function (entries) {
                        entries.forEach(function (entry) {
                            if (entry.isIntersecting) {
                                startStatAnimation();
                                observer.disconnect();
                            }
                        });
                    },
                    {
                        threshold: 0.35
                    }
                );

                observer.observe(statCard);
            } else {
                startStatAnimation();
            }
        });

document.addEventListener("DOMContentLoaded", function () {
            const reducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            const groups = [
                {
                    selector: ".site-header .logo, .site-header .nav-link, .site-header .nav-actions > *",
                    type: "reveal-scale"
                },
                {
                    selector: ".hero-badge, .hero-title, .hero-desc, .hero-actions > *",
                    type: "reveal-left"
                },
                {
                    selector: ".hero-img-wrap > img, .hero-img-wrap .hero-stat-card",
                    type: "reveal-right"
                },
                {
                    selector: "main section .section-tag, main section .section-title, main section .section-desc, body > section:not(.hero) .section-tag, body > section:not(.hero) .section-title, body > section:not(.hero) .section-desc",
                    type: ""
                },
                {
                    selector: ".benefit-card, .service-card, .portfolio-card, .process-card, .testimonial-card, .faq-item, .location-card, .area-card",
                    type: "reveal-scale"
                },
                {
                    selector: "main section img, body > section:not(.hero) img",
                    type: "reveal-image"
                },
                {
                    selector: ".cta-box > *, .footer-grid > *, .footer-bottom > *",
                    type: ""
                }
            ];

            const animatedElements = [];
            const seen = new Set();

            groups.forEach(function (group) {
                document.querySelectorAll(group.selector).forEach(
                    function (element, index) {
                        if (
                            seen.has(element) ||
                            element.closest(".cart-drawer") ||
                            element.classList.contains("hero-stat-card")
                        ) {
                            return;
                        }

                        seen.add(element);
                        element.classList.add("page-reveal");

                        if (group.type) {
                            element.classList.add(group.type);
                        }

                        element.style.setProperty(
                            "--reveal-delay",
                            Math.min(index % 5, 4) * 90 + "ms"
                        );

                        animatedElements.push(element);
                    }
                );
            });

            if (reducedMotion || !("IntersectionObserver" in window)) {
                animatedElements.forEach(function (element) {
                    element.classList.add("is-revealed");
                });
                return;
            }

            const observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("is-revealed");
                            observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.12,
                    rootMargin: "0px 0px -7% 0px"
                }
            );

            animatedElements.forEach(function (element) {
                observer.observe(element);
            });
        });
