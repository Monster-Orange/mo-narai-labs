# The gate, as make targets (the same scripts pnpm runs).
.PHONY: install preflight e2e dev

install:
	pnpm install --frozen-lockfile

preflight:
	pnpm preflight

e2e:
	pnpm e2e

dev:
	pnpm dev
