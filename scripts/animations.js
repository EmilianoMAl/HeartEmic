document.addEventListener('DOMContentLoaded', function() {
  
  const navbar = document.querySelector('.navbar, .barra-superior');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    observer.observe(el);
  });

  document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });

  const smoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  };
  
  smoothScroll();

  const createMorphingShapes = () => {
    const shapes = document.querySelectorAll('.morph-shape');
    shapes.forEach(shape => {
      setInterval(() => {
        const randomScale = 0.8 + Math.random() * 0.4;
        const randomX = -20 + Math.random() * 40;
        const randomY = -20 + Math.random() * 40;
        shape.style.transform = `translate(${randomX}px, ${randomY}px) scale(${randomScale})`;
      }, 4000);
    });
  };
  
  createMorphingShapes();

  const typeWriter = (element, text, speed = 50) => {
    let i = 0;
    element.textContent = '';
    
    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    };
    
    type();
  };

  const terminalElements = document.querySelectorAll('.terminal-text');
  const terminalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.typed) {
        const text = entry.target.textContent;
        entry.target.dataset.typed = 'true';
        typeWriter(entry.target, text, 30);
      }
    });
  }, { threshold: 0.5 });

  terminalElements.forEach(el => terminalObserver.observe(el));

  const parallaxElements = document.querySelectorAll('.parallax');
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    parallaxElements.forEach(el => {
      const speed = el.dataset.speed || 0.5;
      el.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });

  const breathingCircle = document.querySelector('.breathing-circle');
  if (breathingCircle) {
    let inhaling = true;
    const breathText = document.querySelector('.breath-text');
    
    setInterval(() => {
      if (inhaling) {
        if (breathText) breathText.textContent = 'Inhala...';
      } else {
        if (breathText) breathText.textContent = 'Exhala...';
      }
      inhaling = !inhaling;
    }, 4000);
  }

  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.dataset.code || btn.previousElementSibling?.textContent;
      
      try {
        await navigator.clipboard.writeText(code);
        
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = 'var(--sage-green)';
        
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.background = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  });

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const applyDarkMode = (isDark) => {
    if (isDark && document.body.classList.contains('auto-dark-mode')) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  if (document.body.classList.contains('auto-dark-mode')) {
    applyDarkMode(prefersDark.matches);
    prefersDark.addEventListener('change', (e) => applyDarkMode(e.matches));
  }

  const floatingElements = document.querySelectorAll('.floating');
  floatingElements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.2}s`;
  });

  document.querySelectorAll('.blob-btn').forEach(btn => {
    btn.addEventListener('mouseenter', function(e) {
      const blob = document.createElement('div');
      blob.className = 'blob-effect';
      this.appendChild(blob);
      
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      blob.style.left = x + 'px';
      blob.style.top = y + 'px';
      
      setTimeout(() => blob.remove(), 1000);
    });
  });

});
