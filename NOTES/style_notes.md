# UI & Styling - the design journey

## Global Styles Setup

angular CLI created  styles.scss in src/


## Layout Issues

the navbar was overlapping content because we didn't account for its height.

tried absolute positioning first - bad idea, broke responsiveness.

then tried fixed positioning with padding on main content - worked but created weird scrolling behavior.

finally got flexbox layout at app level:

```scss
// app.component.scss
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  app-navbar {
    flex-shrink: 0;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
  }
}
```

## Responsive Design Struggles

made the site for desktop first, then realized mobile needed work.
 
added breakpoints:

```scss
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;

@mixin respond-to($breakpoint) {
  @if $breakpoint == sm {
    @media (max-width: #{$breakpoint-sm}) { @content; }
  } @else if $breakpoint == md {
    @media (max-width: #{$breakpoint-md}) { @content; }
  } @else if $breakpoint == lg {
    @media (max-width: #{$breakpoint-lg}) { @content; }
  }
}

.button {
  padding: $spacing-unit * 2 $spacing-unit * 4;

  @include respond-to(sm) {
    padding: $spacing-unit * 1.5 $spacing-unit * 3;
    font-size: 0.9rem;
  }
}
```      