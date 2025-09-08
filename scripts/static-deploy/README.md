# Static Deploy

This package manages **configuration and deployment scripts** for Opentrons static websites such as **Labware Library** and **Protocol Designer**.  
Python and dependencies are managed with [uv](https://github.com/astral-sh/uv).

---

## Philosophy

- **One workflow**: scripts are designed to run in **GitHub Actions** as the default deployment path.
- **Local fallback**: every script can be run locally with the proper flags (e.g. `make PROFILE=the_profile ENV=sandbox APPLICATION=protocol_designer deploy`) in case CI is unavailable.
- **Consistency**: all commands are standardized through the `Makefile`
