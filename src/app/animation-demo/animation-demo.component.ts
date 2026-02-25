import { Component, OnInit } from '@angular/core';
import AOS from 'aos';

@Component({
  selector: 'app-animation-demo',
  standalone: false,
  templateUrl: './animation-demo.component.html',
  styleUrls: ['./animation-demo.component.css']
})
export class AnimationDemoComponent implements OnInit {
  savedAnimations: any[] = [];
  isSaving = false;
  Math = Math;

  ngOnInit() {
    // Refresh AOS when component initializes
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }

  saveAnimationState() {
    this.isSaving = true;
    
    // Get all elements with AOS
    const animatedElements = document.querySelectorAll('[data-aos]');
    const animationStates = Array.from(animatedElements).map((element: any) => ({
      id: element.id || element.textContent.substring(0, 20),
      animation: element.getAttribute('data-aos'),
      duration: element.getAttribute('data-aos-duration'),
      delay: element.getAttribute('data-aos-delay'),
      offset: element.getAttribute('data-aos-offset'),
      position: element.getBoundingClientRect()
    }));

    this.savedAnimations = animationStates;
    
    // Save to localStorage
    localStorage.setItem('savedAnimations', JSON.stringify(animationStates));
    
    setTimeout(() => {
      this.isSaving = false;
    }, 500);
  }

  loadAnimationStates() {
    const saved = localStorage.getItem('savedAnimations');
    if (saved) {
      this.savedAnimations = JSON.parse(saved);
    }
  }

  clearSavedAnimations() {
    this.savedAnimations = [];
    localStorage.removeItem('savedAnimations');
  }

  refreshAnimations() {
    AOS.refresh();
  }
}
