@../CLAUDE.md

# todo-frontend 저장소 전용 보강

이 저장소를 단독으로 클론하면 위 임포트가 가리키는 부모 `CLAUDE.md`가 없다. 그 경우에도 아래는 이 저장소 안에서 바로 확인 가능한 사실이다.

- 빌드/린트: `npm run build` · `npm run lint` · `npm run typecheck` · `npm run format:check` (전부 묶은 것은 `npm run validate`)
- 경로 별칭 `@/*`는 `src/*`를 가리킨다(`tsconfig.json`). 소스는 전부 `src/` 아래에 둔다.
- Node 버전은 `.nvmrc` 기준.
- shadcn/ui 컴포넌트(`src/components/ui/**`)는 생성된 그대로 유지하고 ESLint 규칙 완화 대상이다(`eslint.config.mjs`).
