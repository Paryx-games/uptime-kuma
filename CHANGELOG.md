# Changelog

Releases of this fork. Each one names the Uptime Kuma version it is built on. Upstream changes are in [Uptime Kuma's releases](https://github.com/louislam/uptime-kuma/releases).

## 1.0.0: 2026-11-17

Based on Uptime Kuma 2.5.11.

### Interface

* Add Carbon dark theme and Geist font
* Replace top header with labelled sidebar
* Show monitors as grouped rows
* Replace quick stats with an overview page
* Redesign the monitor detail page
* Restyle settings pages, forms and charts
* Redesign the sign-in screen
* Restyle maintenance, status pages and dialogs
* Rework the monitor list toolbar
* Swap filter counts for checkboxes on hover
* Make whole rows clickable with a soft hover
* Colour the current state by status
* Remove slide and fade animations
* Quiet the About page logo
* Make tag pills small and outlined
* Add profile picture upload

### Fixes

* Keep the filter menu closable
* Show maintenance dates in 24-hour time
* Keep list tools on screen on phones
* Fix sign-in page scrolling on phones
* Stop iPhone zooming in on focused fields
* Raise grey contrast, quiet focus rings
* Register missing translation keys

### Build

* Add a fork Docker image on the official base
* Stamp the fork version on builds
