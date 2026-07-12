import type { ResumeAnalysis, JobMatchResult, ProfileImprovementResult } from './types';

export const demoResults = {
  product: {
    analysis: {
      score: 82,
      extractedSkills: ["Customer Development", "Product Management", "A/B Testing", "Amplitude", "SQL", "Unit Economics", "Agile/Scrum", "Jira", "User Stories"],
      strongPoints: [
        "Отличная плотность цифр в описании достижений (например, увеличение конверсии на 4.2% и 8%)",
        "Подробное знание современных инструментов продуктовой веб-аналитики (Amplitude, Яндекс.Метрика)",
        "Подтвержденный опыт лидерства кросс-функциональной команды из 8 специалистов"
      ],
      gapsAndWeaknesses: [
        "Слабый акцент на технических аспектах интеграции API и баз данных (упомянут только базовый SQL)",
        "Недостаточное описание работы с долгосрочной стратегией продукта и OKR (фокус смещен на тактику)",
        "Мало деталей по бюджетированию и финансовому планированию"
      ],
      atsChecklist: [
        { item: "Разделы контактов легко считываются", passed: true },
        { item: "Используются сильные глаголы действия в достижениях", passed: true },
        { item: "Отсутствуют избыточные графические элементы (совместимо с ATS)", passed: true },
        { item: "Указаны конкретные числовые KPI и метрики", passed: true },
        { item: "Присутствует структурированное описание образования", passed: true },
        { item: "Добавлено описание владения английским языком", passed: false }
      ]
    } as ResumeAnalysis,
    optimization: {
      atsOptimizedSummary: "Middle Product Manager с 3+ годами опыта управления B2C/E-commerce продуктами. Специализируюсь на оптимизации конверсий платежных путей, чекаута и юнит-экономики. Опыт проведения 30+ качественных исследований (CustDev), настройки сквозной веб-аналитики в Amplitude и успешного внедрения A/B-тестов. Обладаю сильными лидерскими качествами, управляла кросс-функциональной командой (8 FTE).",
      improvedBulletPoints: [
        "Спроектировал и курировал редизайн страницы оплаты чекаута, увеличив конверсию в успешный заказ на 4.2% за 3 месяца.",
        "Настроил продуктовые дашборды в Amplitude для 12+ метрик, сократив время поиска аномалий пользовательского поведения на 40%.",
        "Сократил Time-to-Market выпуска приоритетных продуктовых фич на 15% за счет оптимизации бэклога в Jira и Scrum-процессов."
      ],
      learningPath: [
        {
          skill: "Основы системной архитектуры и API",
          importance: "Высокая",
          resources: "Изучение REST API, спецификации OpenAPI/Swagger, проектирование реляционных баз данных."
        },
        {
          skill: "Работа с OKR (Objectives and Key Results)",
          importance: "Средняя",
          resources: "Руководства по стратегическому планированию, фреймворки Google OKR."
        },
        {
          skill: "Продвинутый SQL для аналитики",
          importance: "Рекомендуемая",
          resources: "Интерактивный тренажер SQL, изучение оконных функций (Window Functions) и оптимизации запросов."
        }
      ]
    } as ProfileImprovementResult
  },
  developer: {
    analysis: {
      score: 65,
      extractedSkills: ["HTML5", "CSS3", "JavaScript", "React", "Redux Toolkit", "Git", "Tailwind CSS", "Flexbox", "Grid"],
      strongPoints: [
        "Хорошо структурированные контактные данные и ссылки на GitHub",
        "Практический опыт адаптивной верстки лендингов по макетам из Figma",
        "Успешное применение современных CSS-библиотек (Tailwind CSS) для ускорения стилизации"
      ],
      gapsAndWeaknesses: [
        "Отсутствие упоминания коммерческого опыта на TypeScript (критично для Middle-вакансий)",
        "Практически отсутствуют оцифрованные показатели успешности выполненных задач (цифры, проценты)",
        "Слабое понимание современных практик инфраструктуры разработки (Docker, CI/CD, сборщиков)"
      ],
      atsChecklist: [
        { item: "Контактные данные легко считываются", passed: true },
        { item: "Используются сильные глаголы действия", passed: false },
        { item: "Присутствуют числовые показатели", passed: false },
        { item: "Структурированное описание опыта", passed: true },
        { item: "Наличие раздела с навыками", passed: true },
        { item: "Описание владения языками", passed: false }
      ]
    } as ResumeAnalysis,
    optimization: {
      atsOptimizedSummary: "Frontend-разработчик с опытом создания адаптивных веб-интерфейсов и лендингов. Владею HTML5, CSS3, JavaScript, React, Redux Toolkit, Git, Tailwind CSS. Создаю pixel-perfect макеты из Figma с упором на производительность и кросс-браузерную совместимость.",
      improvedBulletPoints: [
        "Разработал и внедрил адаптивную верстку для 10+ лендингов, обеспечив корректное отображение на всех устройствах.",
        "Оптимизировал производительность загрузки страниц на 25% за счет уменьшения размера CSS-бандлов и использования современных подходов.",
        "Интегрировал Tailwind CSS в проект, сократив время разработки стилей на 30%."
      ],
      learningPath: [
        {
          skill: "TypeScript",
          importance: "Критическая",
          resources: "Официальная документация TypeScript, курс на TypeScript Deep Dive, практика с React + TypeScript."
        },
        {
          skill: "Docker и CI/CD",
          importance: "Высокая",
          resources: "Docker для разработчиков, настройка GitHub Actions для автоматического деплоя."
        },
        {
          skill: "Next.js",
          importance: "Рекомендуемая",
          resources: "Официальная документация Next.js, проект на App Router."
        }
      ]
    } as ProfileImprovementResult
  },
  match: {
    matchScore: 78,
    matchedSkills: ["React", "TypeScript", "Tailwind CSS", "Git", "JavaScript"],
    missingSkills: ["Docker", "CI/CD", "GraphQL"],
    recommendations: "У вас хорошая база, но рекомендую изучить Docker и CI/CD для повышения уровня."
  } as JobMatchResult
};

export const sampleResumes = {
  product: `КОНТАКТЫ
Email: product.manager@example.com
Телефон: +7 (999) 123-45-67
LinkedIn: linkedin.com/in/productmanager
GitHub: github.com/productmanager

ПРОФЕССИОНАЛЬНЫЙ ОПЫТ

Middle Product Manager | ООО "ТехКомпания" | 2021 - настоящее время
• Управление B2C/E-commerce продуктом, генерирующим $2.5M ARR
• Увеличил конверсию в успешный заказ на 4.2% через редизайн чекаута (влияние: +$100K в год)
• Проведено 30+ исследований поведения пользователей (CustDev) для выявления болевых точек
• Настроил продуктовые дашборды в Amplitude для 12+ ключевых метрик, сократив время анализа на 40%
• Спроектировал и внедрил A/B-тестирование для 8+ гипотез с результатом +8% в ARPU

Junior Product Manager | Стартап "МобильРеш" | 2019 - 2021
• Создал и внедрил стратегию локализации приложения для 5 новых рынков
• Увеличил органический трафик на 150% через оптимизацию App Store Optimization
• Управлял кросс-функциональной командой из 8 специалистов (дизайнеры, инженеры, маркетеры)

НАВЫКИ
Управление продуктом: OKR, Agile/Scrum, Jira, Amplitude, A/B-тестирование
Аналитика: SQL, Data Analysis, Customer Development, Unit Economics
Инструменты: Figma, Яндекс.Метрика, Google Sheets, Power BI

ОБРАЗОВАНИЕ
Бакалавр, Экономика | МГУ имени М.В. Ломоносова | 2019`,

  developer: `КОНТАКТЫ
Email: frontend.dev@example.com
Телефон: +7 (999) 987-65-43
GitHub: github.com/frontenddev
Portfolio: portfolio.example.com

ПРОФЕССИОНАЛЬНЫЙ ОПЫТ

Frontend Developer | ООО "ВебСтудия" | 2021 - настоящее время
• Разработал адаптивную верстку 15+ лендингов, обеспечив pixel-perfect соответствие макетам Figma
• Внедрил Tailwind CSS в проект, сократив время разработки стилей на 30%
• Оптимизировал производительность приложения: улучшил Core Web Vitals на 25%
• Создал переиспользуемую систему компонентов на React, ускорив разработку на 40%

Junior Frontend Developer | Фриланс | 2019 - 2021
• Верстал кастомные веб-сайты на HTML5/CSS3/JavaScript
• Работал с макетами из Figma, обеспечивая точное соответствие дизайну
• Внедрял интерактивные элементы с использованием jQuery и Vanilla JS

НАВЫКИ
Frontend: HTML5, CSS3, JavaScript (ES6+), React, Next.js, Redux Toolkit
Styling: Tailwind CSS, CSS Grid, Flexbox, Responsive Design
Инструменты: Git, Figma, VS Code, npm, webpack

ОБРАЗОВАНИЕ
Курс "Advanced React" | GeekBrains | 2021
Курс "Frontend Development" | Codecademy | 2019
Школа-гимназия | Москва | 2017`
};

export const sampleJobs = {
  developer: `Вакансия: Senior Frontend Developer

О компании:
ООО "ТехИнновации" - быстрорастущий стартап в сфере FinTech. Ищем опытного Frontend разработчика для расширения команды.

Требования:
• 3+ года опыта разработки на React/Next.js
• Отличные знания TypeScript, HTML5, CSS3, JavaScript (ES6+)
• Опыт работы с Redux Toolkit, RTK Query или аналогичными решениями
• Опыт оптимизации производительности веб-приложений
• Опыт написания unit-тестов (Jest, Testing Library)
• Git, REST API, работа в Agile-команде

Будет плюсом:
• Опыт с Docker и CI/CD
• Знание GraphQL
• Опыт создания системы дизайн-компонентов
• Опыт с Tailwind CSS

Что предлагаем:
• Зарплата: 250-350K рублей в месяц
• Удаленная работа из России
• Интересные проекты в FinTech
• Профессиональный рост и менторство
• Стек: Next.js, TypeScript, Tailwind CSS, PostgreSQL, Docker`
};

