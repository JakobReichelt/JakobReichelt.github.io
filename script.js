// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const CONFIG = {
  DETAIL_WIDTH: 0.4, // 40vw
  PEEK_AMOUNT: 40,
  SCROLL_DEBOUNCE: 50,
  GEDANKEN: [
    [
      { file: 'content/Gedanken/Gedanken1.txt', hasTitle: false, scrollable: false }
    ],
    [
      { file: 'content/Gedanken/Gedanken2.0.txt', hasTitle: true, scrollable: true },
      { file: 'content/Gedanken/Gedanken2.1.txt', hasTitle: true, scrollable: true }
    ],
    [
      { file: 'content/Gedanken/Gedanken3.txt', hasTitle: false, scrollable: false }
    ]
  ],
  PROJECTS: [
    {
      name: 'Das Irrlicht',
      description: 'A photographic exploration of wandering lights and atmospheric moments.',
      detailedDescription: 'This series captures the ephemeral nature of light as it dances through darkness, creating moments of wonder and mystery. Each photograph in "Das Irrlicht" explores the interplay between illumination and shadow, revealing how light can transform ordinary scenes into extraordinary visual experiences. The wandering lights serve as metaphors for fleeting moments of clarity and inspiration that guide us through life\'s uncertainties.',
      images: Array.from({ length: 15 }, (_, i) => `content/Arbeit/Das Irrlicht/DasIrrlicht_${i + 1}.JPG`)
    },
    {
      name: 'Helveticum',
      description: 'Capturing the essence of Swiss landscapes and urban environments.',
      detailedDescription: 'A visual journey through Switzerland\'s diverse landscapes and architectural heritage. "Helveticum" documents the unique character of Swiss cities, alpine vistas, and the delicate balance between nature and human development. These images celebrate the precision, beauty, and timeless quality that define the Swiss aesthetic, from mountain peaks to urban spaces, capturing both the grandeur and intimacy of the country\'s distinctive visual culture.',
      images: [
        'content/Arbeit/Helveticum/_1640796.JPG', 'content/Arbeit/Helveticum/_1640805.JPG',
        'content/Arbeit/Helveticum/_1640814.JPG', 'content/Arbeit/Helveticum/_1640822.JPG',
        'content/Arbeit/Helveticum/_1640824.JPG', 'content/Arbeit/Helveticum/_1640825.JPG',
        'content/Arbeit/Helveticum/_1640834.JPG', 'content/Arbeit/Helveticum/_1640864.JPG',
        'content/Arbeit/Helveticum/IMG_2949.jpeg', 'content/Arbeit/Helveticum/P1380810.JPG',
        'content/Arbeit/Helveticum/P1380817.JPG', 'content/Arbeit/Helveticum/P1380824.JPG',
        'content/Arbeit/Helveticum/P1390008.JPG', 'content/Arbeit/Helveticum/P1390026.JPG',
        'content/Arbeit/Helveticum/P1390048.JPG', 'content/Arbeit/Helveticum/PHOTO-2025-04-29-23-27-43 Kopie.jpg'
      ]
    }
  ]
};

// ========================================
// UTILITIES
// ========================================

const utils = {
  getCurrentSection(sections) {
    const centerY = window.innerHeight / 2;
    return sections.reduce((best, sec) => {
      const rect = sec.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - centerY);
      return distance < best.distance ? { section: sec, distance } : best;
    }, { section: null, distance: Infinity }).section;
  },

  getImageIndex(section) {
    if (!section) return 0;
    const detailWidth = window.innerWidth * CONFIG.DETAIL_WIDTH;
    const scroll = section.scrollLeft;
    if (scroll < detailWidth * 0.5) return 0;
    return Math.round((scroll - detailWidth) / window.innerWidth) + 1;
  },

  getMaxIndex(section) {
    const detailWidth = window.innerWidth * CONFIG.DETAIL_WIDTH;
    return Math.floor((section.scrollWidth - detailWidth) / window.innerWidth);
  },

  smoothScrollTo(element, target, duration = 350) {
    if (!element || Math.abs(element.scrollLeft - target) < 1) return Promise.resolve();

    const start = element.scrollLeft;
    const distance = target - start;
    const startTime = performance.now();

    return new Promise(resolve => {
      function step(time) {
        const progress = Math.min((time - startTime) / duration, 1);
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        element.scrollLeft = start + distance * eased;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }
};
// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  preloadImages();

  const projectViewer = document.getElementById('project-viewer');
  if (projectViewer) initializeProjectViewer();

  const gedankenViewer = document.getElementById('gedanken-viewer');
  if (gedankenViewer) initializeGedankenViewer();
});

// ========================================
// GEDANKEN VIEWER
// ========================================

async function initializeGedankenViewer() {
  const viewer = document.getElementById('gedanken-viewer');
  
  if (!viewer) {
    console.error('Gedanken viewer element not found');
    return;
  }
  
  console.log('Initializing gedanken viewer with', CONFIG.GEDANKEN.length, 'groups');
  
  const allGroups = [];
  
  for (const group of CONFIG.GEDANKEN) {
    const groupElement = document.createElement('div');
    groupElement.className = 'gedanken-group';
    
    for (const gedanke of group) {
      try {
        console.log('Fetching:', gedanke.file);
        const response = await fetch(gedanke.file);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Loaded:', gedanke.file, 'Length:', text.length);
        
        const section = document.createElement('section');
        section.className = 'gedanken-section';
        
        const container = document.createElement('div');
        const baseStyle = 'max-width: 600px; text-align: left; font-size: 1.1rem; line-height: 1.8; color: #ffffff; padding: 0 3rem; font-weight: 400;';
        const scrollStyle = gedanke.scrollable ? ' max-height: 80vh; overflow-y: auto;' : '';
        container.style.cssText = baseStyle + scrollStyle;
        
        // Parse content
        const content = parseGedankenContent(text, gedanke.hasTitle);
        container.innerHTML = content;
        
        section.appendChild(container);
        groupElement.appendChild(section);
      } catch (error) {
        console.error(`Error loading ${gedanke.file}:`, error);
      }
    }
    
    viewer.appendChild(groupElement);
    allGroups.push(groupElement);
    
    // Setup horizontal scroll observer for this group
    setupHorizontalScrollObserver(groupElement);
  }
  
  console.log('All gedanken loaded, initializing background');
  
  // Setup unified peek zones that work across all groups
  setupUnifiedGedankenPeekZones(allGroups, viewer);
  
  // Initialize background scroll after all sections are loaded
  initializeGedankenBackground();
}

function setupHorizontalScrollObserver(groupElement) {
  const sections = groupElement.querySelectorAll('.gedanken-section');
  
  if (sections.length <= 1) {
    // If only one section, mark it as active
    sections[0]?.classList.add('active');
    return;
  }
  
  function updateActiveSections() {
    const scrollLeft = groupElement.scrollLeft;
    const groupWidth = groupElement.clientWidth;
    const centerPosition = scrollLeft + groupWidth / 2;
    
    let closestSection = null;
    let minDistance = Infinity;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionLeft = scrollLeft + rect.left;
      const sectionCenter = sectionLeft + section.clientWidth / 2;
      
      // Find the section closest to center
      const distanceFromCenter = Math.abs(sectionCenter - centerPosition);
      
      if (distanceFromCenter < minDistance) {
        minDistance = distanceFromCenter;
        closestSection = section;
      }
    });
    
    // Mark only the closest section as active
    sections.forEach(section => {
      if (section === closestSection) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }
  
  groupElement.addEventListener('scroll', updateActiveSections);
  updateActiveSections(); // Initial call
}

function setupUnifiedGedankenPeekZones(allGroups, viewer) {
  let peekTimeout = null;
  let isPeeking = false;
  let isAnimating = false;
  const PEEK_AMOUNT = 60;
  let updateTimeout = null;
  
  // Create peek zones once
  const leftZone = document.createElement('div');
  leftZone.className = 'gedanken-peek-zone left';
  leftZone.style.opacity = '0';
  leftZone.style.pointerEvents = 'none';
  document.body.appendChild(leftZone);
  
  const rightZone = document.createElement('div');
  rightZone.className = 'gedanken-peek-zone right';
  rightZone.style.opacity = '0';
  rightZone.style.pointerEvents = 'none';
  document.body.appendChild(rightZone);
  
  function getCurrentVisibleGroup() {
    const viewerScrollTop = viewer.scrollTop;
    const viewerHeight = viewer.clientHeight;
    const centerY = viewerScrollTop + viewerHeight / 2;
    
    for (const group of allGroups) {
      const groupTop = group.offsetTop;
      const groupBottom = groupTop + group.offsetHeight;
      
      if (centerY >= groupTop && centerY < groupBottom) {
        return group;
      }
    }
    return allGroups[0] || null;
  }
  
  function getCurrentSectionIndex(groupElement) {
    if (!groupElement) return 0;
    
    const sections = groupElement.querySelectorAll('.gedanken-section');
    if (sections.length === 0) return 0;
    
    const scrollLeft = groupElement.scrollLeft;
    const groupWidth = groupElement.clientWidth;
    const centerPosition = scrollLeft + groupWidth / 2;
    
    let closestIndex = 0;
    let minDistance = Infinity;
    
    sections.forEach((section, index) => {
      const sectionLeft = section.offsetLeft;
      const sectionCenter = sectionLeft + section.clientWidth / 2;
      const distance = Math.abs(sectionCenter - centerPosition);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }
  
  function setScrollSnap(groupElement, enable) {
    if (!groupElement) return;
    if (enable) {
      if (peekTimeout) clearTimeout(peekTimeout);
      peekTimeout = setTimeout(() => {
        if (!isPeeking) groupElement.style.scrollSnapType = 'x mandatory';
      }, 150);
    } else {
      groupElement.style.scrollSnapType = 'none';
    }
  }
  
  function scrollToSection(groupElement, index) {
    const sections = groupElement.querySelectorAll('.gedanken-section');
    if (!sections[index]) return;
    
    setScrollSnap(groupElement, false);
    isAnimating = true;
    
    const section = sections[index];
    const scrollLeft = groupElement.scrollLeft;
    const sectionLeft = section.offsetLeft;
    const groupWidth = groupElement.clientWidth;
    const target = sectionLeft - (groupWidth - section.clientWidth) / 2;
    
    utils.smoothScrollTo(groupElement, target, 450).then(() => {
      setScrollSnap(groupElement, true);
      isAnimating = false;
      updateZoneVisibility();
    });
  }
  
  function updateZoneVisibility() {
    const currentGroup = getCurrentVisibleGroup();
    
    if (!currentGroup) {
      leftZone.style.opacity = '0';
      leftZone.style.pointerEvents = 'none';
      rightZone.style.opacity = '0';
      rightZone.style.pointerEvents = 'none';
      return;
    }
    
    const sections = currentGroup.querySelectorAll('.gedanken-section');
    if (sections.length <= 1) {
      // Only one section, hide both zones
      leftZone.style.opacity = '0';
      leftZone.style.pointerEvents = 'none';
      rightZone.style.opacity = '0';
      rightZone.style.pointerEvents = 'none';
      return;
    }
    
    const currentIndex = getCurrentSectionIndex(currentGroup);
    
    // Show left zone if not on first section
    if (currentIndex > 0) {
      leftZone.style.opacity = '1';
      leftZone.style.pointerEvents = 'auto';
    } else {
      leftZone.style.opacity = '0';
      leftZone.style.pointerEvents = 'none';
    }
    
    // Show right zone if not on last section
    if (currentIndex < sections.length - 1) {
      rightZone.style.opacity = '1';
      rightZone.style.pointerEvents = 'auto';
    } else {
      rightZone.style.opacity = '0';
      rightZone.style.pointerEvents = 'none';
    }
  }
  
  function debouncedUpdate() {
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      if (!isPeeking && !isAnimating) {
        updateZoneVisibility();
      }
    }, 50);
  }
  
  function handlePeek(direction) {
    if (isAnimating) return;
    const currentGroup = getCurrentVisibleGroup();
    if (!currentGroup) return;
    
    setScrollSnap(currentGroup, false);
    
    const offset = direction === 'left' ? -PEEK_AMOUNT : PEEK_AMOUNT;
    const target = direction === 'left'
      ? Math.max(0, currentGroup.scrollLeft + offset)
      : Math.min(currentGroup.scrollWidth - currentGroup.clientWidth, currentGroup.scrollLeft + offset);
    utils.smoothScrollTo(currentGroup, target, 500);
  }
  
  function handleClick(direction) {
    if (isAnimating) return;
    const currentGroup = getCurrentVisibleGroup();
    if (!currentGroup) return;
    
    const sections = currentGroup.querySelectorAll('.gedanken-section');
    const currentIndex = getCurrentSectionIndex(currentGroup);
    const newIndex = direction === 'left'
      ? Math.max(0, currentIndex - 1)
      : Math.min(sections.length - 1, currentIndex + 1);
    scrollToSection(currentGroup, newIndex);
  }
  
  // Setup left zone events
  leftZone.addEventListener('mouseenter', () => {
    if (isAnimating) return;
    isPeeking = true;
    handlePeek('left');
  });
  leftZone.addEventListener('mouseleave', () => {
    if (isAnimating) return;
    isPeeking = false;
    const currentGroup = getCurrentVisibleGroup();
    if (currentGroup) {
      const currentIndex = getCurrentSectionIndex(currentGroup);
      scrollToSection(currentGroup, currentIndex);
    }
  });
  leftZone.addEventListener('click', () => {
    if (isAnimating) return;
    isPeeking = false;
    handleClick('left');
  });
  
  // Setup right zone events
  rightZone.addEventListener('mouseenter', () => {
    if (isAnimating) return;
    isPeeking = true;
    handlePeek('right');
  });
  rightZone.addEventListener('mouseleave', () => {
    if (isAnimating) return;
    isPeeking = false;
    const currentGroup = getCurrentVisibleGroup();
    if (currentGroup) {
      const currentIndex = getCurrentSectionIndex(currentGroup);
      scrollToSection(currentGroup, currentIndex);
    }
  });
  rightZone.addEventListener('click', () => {
    if (isAnimating) return;
    isPeeking = false;
    handleClick('right');
  });
  
  // Update zone visibility on scroll (both vertical and horizontal)
  viewer.addEventListener('scroll', debouncedUpdate);
  
  allGroups.forEach(group => {
    group.addEventListener('scroll', debouncedUpdate);
  });
  
  // Also update on any snap end
  viewer.addEventListener('scrollend', updateZoneVisibility);
  allGroups.forEach(group => {
    group.addEventListener('scrollend', updateZoneVisibility);
  });
  
  updateZoneVisibility(); // Initial call
}

function initializeGedankenBackground() {
  const viewer = document.getElementById('gedanken-viewer');
  const groups = document.querySelectorAll('.gedanken-group');
  
  // Calculate body height based on image aspect ratio
  const img = new Image();
  img.onload = function() {
    const aspectRatio = this.naturalHeight / this.naturalWidth;
    const imageHeight = window.innerWidth * aspectRatio;
    document.body.style.minHeight = imageHeight + 'px';
    
    // Set initial background position BEFORE showing image
    const imageHeightVh = (imageHeight / window.innerHeight) * 100;
    const scrollableVh = imageHeightVh - 100;
    const initialBgPositionVh = -0.1 * scrollableVh;
    document.body.style.backgroundPosition = `0 ${initialBgPositionVh}vh`;
    
    // Now show the image
    document.body.style.backgroundImage = "url('content/Gedanken/hintergrund1.jpg')";
    
    // Update on resize
    window.addEventListener('resize', function() {
      const imageHeight = window.innerWidth * aspectRatio;
      document.body.style.minHeight = imageHeight + 'px';
      updateBackgroundScroll();
    });
    
    // Initialize scroll position after image loads
    setTimeout(updateBackgroundScroll, 50);
  };
  img.src = 'content/Gedanken/PXL_20241229_101743585.MP.jpg';
  
  // Background scroll animation
  function updateBackgroundScroll() {
    const scrollTop = viewer.scrollTop;
    const viewerHeight = viewer.clientHeight;
    const currentGroupIndex = Math.floor(scrollTop / viewerHeight);
    const groupProgress = (scrollTop % viewerHeight) / viewerHeight;
    
    // Update nav color based on scroll
    const nav = document.querySelector('.site-nav');
    if (currentGroupIndex > 0 || groupProgress > 0.1) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    // Calculate scroll percentage through all groups
    const totalGroups = groups.length;
    const maxGroupIndex = totalGroups - 1;
    
    // Normalize scroll progress: 0 = first group, 1 = last group
    let overallProgress = 0;
    if (totalGroups > 1) {
      overallProgress = (currentGroupIndex + groupProgress) / maxGroupIndex;
      overallProgress = Math.min(Math.max(overallProgress, 0), 1);
    }
    
    // Map to 10% - 90% range of the image
    const scrollPercent = 0.1 + (overallProgress * 0.8);
    
    // Calculate how much to offset based on image vs viewport height
    const imageHeightVh = (document.body.offsetHeight / window.innerHeight) * 100;
    const scrollableVh = imageHeightVh - 100; // How much extra height beyond viewport
    const bgPositionVh = -scrollPercent * scrollableVh;
    
    document.body.style.backgroundPosition = `0 ${bgPositionVh}vh`;
  }
  
  viewer.addEventListener('scroll', updateBackgroundScroll);
}

function parseGedankenContent(text, hasTitle) {
  let html = '';
  const lines = text.trim().split('\n');
  let inList = false;
  let indent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines but add margin to previous paragraph
    if (!line.trim()) continue;
    
    // Check for title (starts with ##)
    if (hasTitle && line.startsWith('## ')) {
      html += `<h2 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 1rem 0;">${line.substring(3)}</h2>`;
      continue;
    }
    
    // Check for numbered list
    if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        html += '<ol style="margin: 0 0 1rem 0; padding-left: 1.5rem;">';
        inList = true;
      }
      html += `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
      continue;
    } else if (inList) {
      html += '</ol>';
      inList = false;
    }
    
    // Check for indentation (tabs)
    const tabCount = line.match(/^\t+/);
    if (tabCount) {
      indent = tabCount[0].length;
      const cleanLine = line.replace(/^\t+/, '');
      
      // Check if it's a question (ends with ?)
      const isQuestion = cleanLine.trim().endsWith('?');
      const fontWeight = isQuestion ? ' font-weight: 600;' : '';
      
      const marginLeft = indent * 1; // 1rem per indent level
      html += `<p style="margin: 0 0 0.5rem ${marginLeft}rem;${fontWeight}">${cleanLine}</p>`;
    } else {
      // Regular paragraph
      const marginBottom = i < lines.length - 1 && lines[i + 1].trim() ? ' 1rem' : '';
      html += `<p style="margin: 0${marginBottom ? ' 0 ' + marginBottom + ' 0' : ''};">${line}</p>`;
    }
  }
  
  if (inList) {
    html += '</ol>';
  }
  
  return html;
}

// ========================================
// IMAGE PRELOADING
// ========================================

function preloadImages() {
  CONFIG.PROJECTS.forEach(project => {
    project.images.forEach(path => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = path;
      document.head.appendChild(link);
    });
  });
}

// ========================================
// PROJECT VIEWER
// ========================================

function initializeProjectViewer() {
  const viewer = document.getElementById('project-viewer');
  const sections = [];

  CONFIG.PROJECTS.forEach((project, index) => {
    const section = document.createElement('div');
    section.className = 'project-section';
    section.dataset.project = index;

    const description = document.createElement('div');
    description.className = 'project-description';
    description.innerHTML = `<h2>${project.name}</h2><p>${project.description}</p>`;
    section.appendChild(description);

    // Add detailed info section as first "image" container
    const detailContainer = document.createElement('div');
    detailContainer.className = 'project-image-container project-detail-section';
    
    // Set the first image as background for the detail section
    if (project.images.length > 0) {
      detailContainer.style.setProperty('--bg-image', `url('${project.images[0]}')`);
    }
    
    detailContainer.innerHTML = `
      <div class="project-detail-content">
        <p>${project.detailedDescription}</p>
      </div>
    `;
    section.appendChild(detailContainer);

    project.images.forEach((path, imageIndex) => {
      const container = document.createElement('div');
      container.className = 'project-image-container';

      const img = document.createElement('img');
      img.className = 'project-image';
      img.src = path;
      img.alt = `${project.name} - Image ${imageIndex + 1}`;
      img.loading = imageIndex === 0 ? 'eager' : 'lazy';

      container.appendChild(img);
      section.appendChild(container);
    });

    viewer.appendChild(section);
    sections.push(section);

    // Start at first image (skip detail section)
    const detailWidth = window.innerWidth * CONFIG.DETAIL_WIDTH;
    section.scrollLeft = detailWidth;
  });

  setupDescriptions(sections, viewer);
  setupPeekZones(sections, viewer);
}

// ========================================
// DESCRIPTION VISIBILITY
// ========================================

function setupDescriptions(sections, viewer) {
  const detailWidth = window.innerWidth * CONFIG.DETAIL_WIDTH;

  function update() {
    const current = utils.getCurrentSection(sections);
    sections.forEach(sec => {
      const desc = sec.querySelector('.project-description');
      if (desc) {
        // Show when scrolled to detail section (left side) OR at first image position
        const isVisible = sec === current && (
          (sec.scrollLeft >= 0 && sec.scrollLeft <= detailWidth + 50) ||
          (sec.scrollLeft >= detailWidth - 50 && sec.scrollLeft <= detailWidth + 50)
        );
        desc.classList.toggle('show', isVisible);
      }
    });
  }

  // Throttled scroll handler
  const addScrollListener = (element) => {
    let rafId = null;
    element.addEventListener('scroll', () => {
      if (!rafId) rafId = requestAnimationFrame(() => {
        update();
        rafId = null;
      });
    });
  };

  sections.forEach(addScrollListener);
  addScrollListener(viewer);
  update();
}

// ========================================
// PEEK ZONES
// ========================================

function setupPeekZones(sections, viewer) {
  let peekTimeout = null;
  let isPeeking = false;
  let isAnimating = false;

  function setScrollSnap(section, enable) {
    if (!section) return;
    if (enable) {
      if (peekTimeout) clearTimeout(peekTimeout);
      peekTimeout = setTimeout(() => {
        if (!isPeeking) section.style.scrollSnapType = 'x mandatory';
      }, 150);
    } else {
      section.style.scrollSnapType = 'none';
    }
  }

  function scrollToImage(section, index) {
    if (!section) return;
    const detailWidth = window.innerWidth * CONFIG.DETAIL_WIDTH;
    const target = index === 0 ? 0 : detailWidth + (index - 1) * window.innerWidth;
    setScrollSnap(section, false);
    isAnimating = true;
    utils.smoothScrollTo(section, target, 450).then(() => {
      setScrollSnap(section, true);
      isAnimating = false;
    });
  }

  // Create zones
  const leftZone = document.createElement('div');
  leftZone.className = 'peek-zone left';
  document.body.appendChild(leftZone);

  const rightZone = document.createElement('div');
  rightZone.className = 'peek-zone right';
  document.body.appendChild(rightZone);

  // Update zone visibility
  function updateZoneVisibility() {
    const current = utils.getCurrentSection(sections);
    if (!current) return;

    const currentIndex = utils.getImageIndex(current);
    const maxIndex = utils.getMaxIndex(current);

    leftZone.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
    leftZone.style.opacity = currentIndex === 0 ? '0' : '1';

    rightZone.style.pointerEvents = currentIndex >= maxIndex ? 'none' : 'auto';
    rightZone.style.opacity = currentIndex >= maxIndex ? '0' : '1';
  }

  // Event handlers
  function handlePeek(zone, direction) {
    if (isAnimating) return;
    const current = utils.getCurrentSection(sections);
    if (!current) return;

    setScrollSnap(current, false);
    const offset = direction === 'left' ? -CONFIG.PEEK_AMOUNT : CONFIG.PEEK_AMOUNT;
    const target = direction === 'left'
      ? Math.max(0, current.scrollLeft + offset)
      : Math.min(current.scrollWidth - current.clientWidth, current.scrollLeft + offset);
    utils.smoothScrollTo(current, target, 500);
  }

  function handleClick(direction) {
    if (isAnimating) return;
    const current = utils.getCurrentSection(sections);
    if (!current) return;

    const currentIndex = utils.getImageIndex(current);
    const maxIndex = utils.getMaxIndex(current);
    const newIndex = direction === 'left'
      ? Math.max(0, currentIndex - 1)
      : Math.min(maxIndex, currentIndex + 1);
    scrollToImage(current, newIndex);
  }

  // Setup left zone
  leftZone.addEventListener('mouseenter', () => {
    if (isAnimating) return;
    isPeeking = true;
    handlePeek(leftZone, 'left');
  });
  leftZone.addEventListener('mouseleave', () => {
    if (isAnimating) return;
    isPeeking = false;
    const current = utils.getCurrentSection(sections);
    if (current) scrollToImage(current, utils.getImageIndex(current));
  });
  leftZone.addEventListener('click', () => {
    if (isAnimating) return;
    isPeeking = false;
    handleClick('left');
  });

  // Setup right zone
  rightZone.addEventListener('mouseenter', () => {
    if (isAnimating) return;
    isPeeking = true;
    handlePeek(rightZone, 'right');
  });
  rightZone.addEventListener('mouseleave', () => {
    if (isAnimating) return;
    isPeeking = false;
    const current = utils.getCurrentSection(sections);
    if (current) scrollToImage(current, utils.getImageIndex(current));
  });
  rightZone.addEventListener('click', () => {
    if (isAnimating) return;
    isPeeking = false;
    handleClick('right');
  });

  // Debounced scroll listener
  let scrollTimeout;
  const scrollListener = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateZoneVisibility, CONFIG.SCROLL_DEBOUNCE);
  };

  sections.forEach(section => section.addEventListener('scroll', scrollListener));
  viewer.addEventListener('scroll', scrollListener);

  updateZoneVisibility();
}