Personal homepage codes for telux.

### Run the native Jekyll site

The project has been built with Ruby 3.3.8, Bundler 4.0.23, and the
GitHub Pages 232 dependency set (Jekyll 3.10.0). `Gemfile.lock` records the
resolved versions.

In the existing Ubuntu WSL terminal:

```sh
cd /mnt/c/Users/telux/Documents/GitHub/k-telux.github.io
export BUNDLE_PATH="$HOME/.local/share/k-telux-jekyll/bundle"
bundle_bin="$(ruby -r rubygems -e 'puts File.join(Gem.user_dir, "bin", "bundle")')"
"$bundle_bin" exec jekyll build --safe --trace
"$bundle_bin" exec jekyll serve --config _config.yml,_config.dev.yml --safe --no-watch
```

Open <http://localhost:4004>. The native development server writes to
`_site-local/`; the production build writes to `_site/`. Both are ignored by Git.
Omit `--no-watch` when you want Jekyll to rebuild as source files change.

Ruby and its build prerequisites are installed in WSL. Bundler and project gems
are installed under the WSL user's home directory; no Windows-wide Ruby
installation or global shell configuration is required.

### Lightweight source preview

Run `python scripts/preview.py`, then open <http://127.0.0.1:4000>.
The preview uses the already available PyYAML and markdown-it-py packages.
No dependency is installed by the script.

This is a **source preview, not a native Jekyll build**. It renders the eleven
`layout: editorial` pages through the same HTML layout and serves the real CSS,
JavaScript, images, audio, and downloadable documents. Unsupported Liquid fails
explicitly. The native Jekyll build above is the authoritative deployment check.

The publication target is this root GitHub Pages site (`baseurl: ""`). Page links
and static assets intentionally use root-relative URLs.

Run the small regression checks:

```text
node --test tests/contact.test.cjs tests/site.test.cjs
python -m unittest discover -s scripts -p test_preview.py -v
```

Contact UI tests intercept service responses and never send mail. They verify
validation, duplicate protection, uncertain delivery, recovery, and accepted
responses; they do not establish real mailbox delivery. Local downloads use the
browser's download flow rather than relying on an embedded PDF viewer.

The ignored `artifacts/site-audit/` directory contains before/after screenshots,
three rounds of committee review, and OpenCV verification. It is excluded from
publication, along with local scripts, tests, legacy demo pages, application
materials in `assets/Apply/`, the interview preparation note, and the credential
evaluation PDF. This exclusion does not remove files from existing Git history.

This was forked (then detached) by [Stuart Geiger](https://github.com/staeiou) from the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/), which is © 2016 Michael Rose and released under the MIT License. See LICENSE.md.
