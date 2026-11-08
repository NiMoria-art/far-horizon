# Состояние проекта

**Текущий этап:** 2.1 — GitHub Pages публикация выполняется.

## Готово локально

- Публичный репозиторий создан: [NiMoria-art/far-horizon](https://github.com/NiMoria-art/far-horizon), ветка по умолчанию `main`.
- Настроены Vite base `/far-horizon/`, manifest и workflow `.github/workflows/deploy.yml`.
- `npm ci`, `npm test` (4 проверки) и `npm run build` успешно выполнены через npm CLI; `dist` содержит HTML, manifest, CSS и JS.
- В локальном браузере проверены карта, выбор планеты, сканирование, траты, перелёт, технологии, localStorage после перезагрузки, ширина 390 px без горизонтального переполнения.

## Публикация

Рабочие файлы загружаются в `main` через авторизованную GitHub-сессию: GitHub API connector отклоняет запись в Contents с 403, локального credential helper нет. Workflow и полное дерево проекта ещё переносятся. GitHub Pages, успешный workflow run и конечный URL пока не подтверждены.

## Открытые ограничения

- Тестовые данные и баланс игры временные; процедурной генерации, экономики, колоний и Android-упаковки нет.
- Браузерная проверка выполнена на локальном Vite dev server, опубликованную версию ещё предстоит проверить отдельно.

## Следующий шаг

Завершить загрузку исходников и workflow в `main`, включить GitHub Actions как Pages publishing source, дождаться сборки и проверить фактический preview URL, ресурсы и mobile viewport.
