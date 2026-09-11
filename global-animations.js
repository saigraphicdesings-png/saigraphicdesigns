(function () {
    "use strict";

    const STYLE_ID = "sai-global-reveal-styles";
    const BOUND_ATTRIBUTE = "data-sai-reveal-bound";
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    function installStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            .sai-reveal {
                opacity: 0;
                transform: translateY(26px);
                filter: blur(2.5px);
                transition:
                    opacity .72s ease,
                    transform .82s cubic-bezier(.2,.8,.2,1),
                    filter .72s ease;
                transition-delay: var(--sai-reveal-delay, 0ms);
                will-change: opacity, transform;
            }

            .sai-reveal.sai-from-left {
                transform: translateX(-30px);
            }

            .sai-reveal.sai-from-right {
                transform: translateX(30px);
            }

            .sai-reveal.sai-scale-in {
                transform: scale(.95);
            }

            .sai-reveal.sai-visible {
                opacity: 1;
                transform: translate3d(0,0,0) scale(1);
                filter: blur(0);
            }

            img.sai-reveal.sai-visible {
                animation: saiImageSettle .95s cubic-bezier(.2,.8,.2,1) both;
            }

            @keyframes saiImageSettle {
                from { transform: scale(1.045); }
                to { transform: scale(1); }
            }

            @media (prefers-reduced-motion: reduce) {
                .sai-reveal,
                .sai-reveal.sai-from-left,
                .sai-reveal.sai-from-right,
                .sai-reveal.sai-scale-in,
                .sai-reveal.sai-visible {
                    opacity: 1;
                    transform: none;
                    filter: none;
                    transition: none;
                    animation: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    const observer = !reducedMotion && "IntersectionObserver" in window
        ? new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("sai-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -6% 0px"
            }
        )
        : null;

    function shouldSkip(element) {
        return Boolean(
            element.closest(
                ".cart-drawer, .cart-overlay, .product-modal, .modal, " +
                "[hidden], [aria-hidden='true']"
            ) ||
            element.classList.contains("hero-stat-card") ||
            element.classList.contains("page-reveal") ||
            element.hasAttribute(BOUND_ATTRIBUTE)
        );
    }

    function bindElements() {
        const groups = [
            {
                selector: ".site-header .logo, .site-header .nav-link, .site-header .nav-actions > *, .mobile-menu-btn",
                effect: "sai-scale-in"
            },
            {
                selector: ".hero h1, .hero h2, .hero .hero-title, .hero .hero-badge, .hero p, .page-hero h1, .page-hero p",
                effect: "sai-from-left"
            },
            {
                selector: ".hero img, .page-hero img, .hero-img-wrap > img",
                effect: "sai-from-right"
            },
            {
                selector: "main section h1, main section h2, main section h3, main section p, body > section:not(.hero) h1, body > section:not(.hero) h2, body > section:not(.hero) h3, body > section:not(.hero) p",
                effect: ""
            },
            {
                selector: ".service-card, .benefit-card, .portfolio-card, .process-card, .testimonial-card, .faq-item, .product-card, .contact-card, .info-card, .location-card, .area-card, .feature-card, .value-card, .team-card",
                effect: "sai-scale-in"
            },
            {
                selector: "main section img, body > section:not(.hero) img, .shop-grid img, .product-grid img",
                effect: "sai-scale-in"
            },
            {
                selector: ".cta-box > *, .contact-form > *, .footer-grid > *, .footer-bottom > *",
                effect: ""
            }
        ];

        groups.forEach(function (group) {
            document.querySelectorAll(group.selector).forEach(
                function (element, index) {
                    if (shouldSkip(element)) {
                        return;
                    }

                    element.setAttribute(BOUND_ATTRIBUTE, "true");
                    element.classList.add("sai-reveal");

                    if (group.effect) {
                        element.classList.add(group.effect);
                    }

                    element.style.setProperty(
                        "--sai-reveal-delay",
                        Math.min(index % 5, 4) * 80 + "ms"
                    );

                    if (observer) {
                        observer.observe(element);
                    } else {
                        element.classList.add("sai-visible");
                    }
                }
            );
        });
    }

    function initialize() {
        installStyles();
        bindElements();

        const contentObserver = new MutationObserver(function (mutations) {
            const hasAddedContent = mutations.some(function (mutation) {
                return mutation.addedNodes.length > 0;
            });

            if (hasAddedContent) {
                window.requestAnimationFrame(bindElements);
            }
        });

        contentObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
