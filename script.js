document.addEventListener("DOMContentLoaded", () => {

    // ----------------------------------------------------
    // CONSTANTS & CONFIG
    // ----------------------------------------------------
    const FRAME_COUNT = 72; // Frames 00 to 71
    const FRAME_DIR = "./V1-ezgif-split"; // Relative path to image directory from /Web/
    const htmlObj = document.documentElement;
    const canvas = document.getElementById("hero-canvas");
    const context = canvas.getContext("2d");

    // Track loaded images
    const images = [];
    let loadedImages = 0;

    // Define canvas size up front based on common cinematic aspect ratio
    // This allows crisp rendering and avoids stretching bugs
    canvas.width = 1920;
    canvas.height = 1080;

    // ----------------------------------------------------
    // PRELOAD CANVAS SEQUENCE
    // ----------------------------------------------------

    // Helper to pad the frame index with a leading zero if needed
    const currentFrame = index => {
        const paddedIndex = index.toString().padStart(2, '0');
        // Matches your directory: frame_00_delay-0.042s.webp
        return `${FRAME_DIR}/frame_${paddedIndex}_delay-0.042s.webp`;
    };

    // Preload loop
    for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        images.push(img);

        img.onload = () => {
            loadedImages++;
            // Draw the very first frame immediately once it loads
            if (i === 0) {
                if (htmlObj.scrollTop === 0) {
                    renderCanvasFrame(0);
                } else {
                    window.dispatchEvent(new Event('scroll'));
                }
            }
        };
    }

    // Safely draw a frame to the canvas, handling aspect ratio covering
    function renderCanvasFrame(index) {
        if (!images[index] || !images[index].complete) return;

        const img = images[index];
        context.clearRect(0, 0, canvas.width, canvas.height); // clear rect
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // ----------------------------------------------------
    // SCROLL HANDLER (MAP SCROLL POSITION TO FRAME MATRIX)
    // ----------------------------------------------------

    window.addEventListener('scroll', () => {
        // 1. Calculate how far down the user has scrolled
        const scrollTop = htmlObj.scrollTop;

        // 2. Subtract window height to get max scrollable area
        const maxScrollTop = htmlObj.scrollHeight - window.innerHeight;

        // 3. Convert scroll amount to a decimal 0.0 -> 1.0
        const scrollFraction = scrollTop / maxScrollTop;

        // 4. Map the decimal to the total number of frames
        const frameIndex = Math.min(
            FRAME_COUNT - 1,
            Math.floor(scrollFraction * FRAME_COUNT)
        );

        // Request the browser to draw the mapped frame efficiently
        requestAnimationFrame(() => renderCanvasFrame(frameIndex));

        // NAVBAR BLUR
        const navbar = document.querySelector(".navbar");
        if (scrollTop > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });


    // ----------------------------------------------------
    // INTERSECTION OBSERVERS (FADE / REVEAL ON SCROLL)
    // ----------------------------------------------------

    // 1. Standard Reveals .reveal-up
    const reveals = document.querySelectorAll(".reveal-up");
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    reveals.forEach(el => revealObserver.observe(el));


    // 2. Staggered Reveals .reveal-stagger (For bento grid items)
    // 2. Staggered Reveals .reveal-stagger
    // Dynamically find all parent containers of stagger items so no section is left behind
    const staggerElements = document.querySelectorAll(".reveal-stagger");
    const staggerParents = new Set();
    staggerElements.forEach(el => staggerParents.add(el.parentElement));

    staggerParents.forEach(container => {
        const children = container.querySelectorAll(".reveal-stagger");

        const staggerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    children.forEach((child, index) => {
                        setTimeout(() => child.classList.add("active"), index * 150);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        staggerObserver.observe(container);
    });

    // ----------------------------------------------------
    // HEX-GRID HOVER PHYSICS (Tech Arsenal)
    // ----------------------------------------------------
    // Replaces standard CSS skill bars with interactive nodes
    const grids = document.querySelectorAll(".hex-grid");

    grids.forEach(grid => {
        const powerLevel = parseInt(grid.getAttribute("data-level")) || 0;
        const colorClass = grid.getAttribute("data-color") === "cyan" ? "active-cyan" : "active-orange";

        // Calculate how many hex elements out of 10 represent this powerLevel
        // e.g. 85% = 8.5 hexes (we round to 8 or 9)
        const hexCount = 10;
        const activeHexes = Math.ceil((powerLevel / 100) * hexCount);

        // Generate the DOM nodes
        for (let i = 0; i < hexCount; i++) {
            const dot = document.createElement("div");
            dot.classList.add("hex-dot");
            // Only illuminate the nodes up to the skill level
            if (i < activeHexes) {
                dot.classList.add(colorClass);
            }
            grid.appendChild(dot);
        }
    });

    // ----------------------------------------------------
    // GITHUB PUBLIC REPOS API (Dynamic Mission Logs)
    // ----------------------------------------------------
    const githubGrid = document.getElementById("github-projects");

    if (githubGrid) {
        // Fetch repositories from Adesh's GitHub, sorted by updated time
        fetch('https://api.github.com/users/AdeshYadav8918/repos?sort=updated&per_page=6')
            .then(response => {
                if (!response.ok) throw new Error("API Limit or Network Error");
                return response.json();
            })
            .then(repos => {
                githubGrid.innerHTML = ''; // Clear loading text

                repos.forEach((repo, index) => {
                    // Filter out forks if preferred
                    if (repo.fork) return;

                    const languageLabel = repo.language ? repo.language.toUpperCase() : "CODEBASE";
                    const desc = repo.description || "Classified objective. No public operative description provided.";

                    const card = document.createElement("div");
                    card.className = "mission-card glass reveal-stagger";

                    card.innerHTML = `
                        <div class="mission-head">
                            <span class="mono text-cyan text-sm">[ OP: ${languageLabel} ]</span>
                        </div>
                        <h4 class="mission-title">${repo.name}</h4>
                        <p class="mission-desc">${desc}</p>
                        <a href="${repo.html_url}" target="_blank" class="mission-link mono">
                            View Proof <i class="fas fa-arrow-right"></i>
                        </a>
                    `;

                    githubGrid.appendChild(card);

                    // Trigger fade-in cascade
                    setTimeout(() => {
                        card.classList.add("active");
                    }, 200 + (index * 150));
                });
            })
            .catch(error => {
                githubGrid.innerHTML = `<p class="mono text-orange w-full text-center">Connection Intercepted: Failed to load GitHub repositories.</p>`;
                console.error("GitHub Fetch Error:", error);
            });
    }

    // ----------------------------------------------------
    // CONTACT LOGIC DEPRECATED
    // Replaced with dedicated mailto: and tel: icons in header/footer
    // ----------------------------------------------------

});
