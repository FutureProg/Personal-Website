# Personal Website

Nick Morrison's personal site/portfolio: a Vike + React app with a homepage, work case studies, and writing posts.

## Language

**NavLink**:
A single navigable entry rendered by the NavBar: a label paired with an href. Covers both in-page anchors (`#about`) and route links (`/`) uniformly — no distinct "anchor" vs "route" kind.
_Avoid_: menu item, nav item

**Page Links**:
The set of NavLinks specific to the current page, declared per-route (e.g. homepage's About/Work/Writing anchors; a post page's single "Home" link). Varies per page.
_Avoid_: nav config, menu

**Social Links**:
The fixed Github and LinkedIn icon links. Always rendered by NavBar on every page; not declared per-page.
_Avoid_: social icons (as a per-page concept — they aren't one)

**Get in touch (CTA)**:
The NavBar's call-to-action button, distinct from Page Links and Social Links because it renders as a button, not a text link. Declared per-page like Page Links (present on the homepage, absent on post pages) but modeled as its own field rather than mixed into the Page Links array.
_Avoid_: contact link

**Post Page**:
A content detail page rendered from a slug — covers both `/work/@slug` and `/writing/@slug`. Shows only a single "Home" Page Link and no CTA.
_Avoid_: blog post page (ambiguous — this repo has two kinds of slug-based detail pages, Work and Writing, and both count)
