(function () {
    "use strict";

    const STYLE_ID = "sai-global-reveal-styles";
    const BOUND_ATTRIBUTE = "data-sai-reveal-bound";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const groups = [
        { selector: ".site-header .logo, .site-header .nav-link, .site-header .nav-actions > *, .mobile-menu-btn", effect: "sai-scale-in" },
        { selector: ".hero h1, .hero h2, .hero .hero-title, .hero .hero-badge, .hero p, .page-hero h1, .page-hero p", effect: "sai-from-left" },
        { selector: ".hero img, .page-hero img, .hero-img-wrap > img", effect: "sai-from-right" },
        { selector: "main section h1, main section h2, main section h3, main section p, body > section:not(.hero) h1, body > section:not(.hero) h2, body > section:not(.hero) h3, body > section:not(.hero) p", effect: "" },
        { selector: ".service-card, .benefit-card, .portfolio-card, .process-card, .testimonial-card, .faq-item, .product-card, .contact-card, .info-card, .location-card, .area-card, .feature-card, .value-card, .team-card", effect: "sai-scale-in" },
        { selector: "main section img, body > section:not(.hero) img, .shop-grid img, .product-grid img", effect: "sai-scale-in" },
        { selector: ".cta-box > *, .contact-form > *, .footer-grid > *, .footer-bottom > *", effect: "" }
    ];

    function installStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            :root {
                --primary: #10B981;
                --primary-hover: #059669;
                --primary-light: #ECFDF5;
                --dark: #111827;
                --dark-muted: #5F6878;
                --light: #F7F9FA;
                --white: #FFFFFF;
                --border: #E2E6EA;
                --accent-orange: #F5A623;
                --brand-green: #10B981;
                --brand-green-dark: #059669;
                --brand-green-deep: #047857;
                --brand-green-soft: #ECFDF5;
                --brand-yellow: #F5A623;
                --brand-ink: #111827;
                --brand-copy: #5F6878;
                --brand-line: #E2E6EA;
                --brand-surface: #FFFFFF;
                --brand-canvas: #F7F9FA;
            }
            body { background:#FFFFFF; color:#5F6878; }
            h1,h2,h3,h4,h5,h6 { color:#111827; }
            .site-footer,footer { background:#0F172A !important; }
            .sai-reveal {
                opacity:0;
                transform:translateY(26px);
                transition:opacity .5s ease, transform .62s cubic-bezier(.2,.8,.2,1);
                transition-delay:var(--sai-reveal-delay,0ms);
            }
            .sai-reveal.sai-from-left { transform:translateX(-30px); }
            .sai-reveal.sai-from-right { transform:translateX(30px); }
            .sai-reveal.sai-scale-in { transform:scale(.96); }
            .sai-reveal.sai-visible { opacity:1; transform:translate3d(0,0,0) scale(1); }
            @media (prefers-reduced-motion: reduce) {
                .sai-reveal,.sai-reveal.sai-from-left,.sai-reveal.sai-from-right,.sai-reveal.sai-scale-in,.sai-reveal.sai-visible {
                    opacity:1; transform:none; transition:none; animation:none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    const observer = !reducedMotion && "IntersectionObserver" in window
        ? new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
                if(entry.isIntersecting){
                    entry.target.classList.add("sai-visible");
                    observer.unobserve(entry.target);
                }
            });
        },{threshold:.1,rootMargin:"0px 0px -6% 0px"})
        : null;

    function shouldSkip(element){
        return Boolean(
            element.closest(".cart-drawer, .cart-overlay, .product-modal, .modal, .sai-pay-overlay, [hidden], [aria-hidden='true']") ||
            element.classList.contains("hero-stat-card") ||
            element.classList.contains("page-reveal") ||
            element.hasAttribute(BOUND_ATTRIBUTE)
        );
    }

    function bindElement(element,effect,index){
        if(shouldSkip(element)) return;
        element.setAttribute(BOUND_ATTRIBUTE,"true");
        element.classList.add("sai-reveal");
        if(effect) element.classList.add(effect);
        element.style.setProperty("--sai-reveal-delay",Math.min(index%5,4)*55+"ms");
        if(observer) observer.observe(element); else element.classList.add("sai-visible");
    }

    function bindElements(root){
        root=root||document;
        groups.forEach(function(group){
            var elements=[];
            if(root.nodeType===1 && root.matches && root.matches(group.selector)) elements.push(root);
            if(root.querySelectorAll) elements=elements.concat(Array.from(root.querySelectorAll(group.selector)));
            elements.forEach(function(element,index){bindElement(element,group.effect,index);});
        });
    }

    function initialize(){
        installStyles();
        bindElements(document);

        var pending=new Set();
        var scheduled=false;
        function flush(){
            scheduled=false;
            pending.forEach(function(node){bindElements(node);});
            pending.clear();
        }

        const contentObserver=new MutationObserver(function(mutations){
            mutations.forEach(function(mutation){
                mutation.addedNodes.forEach(function(node){
                    if(node.nodeType===1) pending.add(node);
                });
            });
            if(pending.size && !scheduled){scheduled=true;window.requestAnimationFrame(flush);}
        });

        contentObserver.observe(document.body,{childList:true,subtree:true});
    }

    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",initialize,{once:true});
    else initialize();
})();
