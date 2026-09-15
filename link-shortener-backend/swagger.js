const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Click.me - Сервис сокращения ссылок с аналитикой',
      version: '1.0.0',
      description: `
        REST API для управления короткими ссылками, группами, аналитикой и пользователями.
        
        Основные возможности:
        - Аутентификация (JWT)
        - Управление ссылками (CRUD, корзина, активация/деактивация)
        - Группы и категории
        - Детальная аналитика переходов
        - Профиль пользователя и настройки
        - Экспорт данных
      `
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Сервер разработки'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT-токен, полученный при авторизации'
        }
      },
      schemas: {

        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Сообщение об ошибке'
            }
          }
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Операция выполнена успешно'
            }
          }
        },

        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'Иван Иванов' },
            settings: {
              type: 'object',
              properties: {
                language: { type: 'string', enum: ['ru', 'en'], example: 'ru' },
                timezone: { type: 'string', example: 'Europe/Minsk' },
                notifications: { type: 'boolean', example: true }
              }
            },
            createdAt: { type: 'integer', example: 1640995200000 }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'password123' },
            name: { type: 'string', example: 'Иван Иванов' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        UpdateProfileRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Новое имя' }
          }
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['oldPassword', 'newPassword'],
          properties: {
            oldPassword: { type: 'string', format: 'password', example: 'old123' },
            newPassword: { type: 'string', format: 'password', minLength: 6, example: 'new123' }
          }
        },
        UpdateSettingsRequest: {
          type: 'object',
          properties: {
            language: { type: 'string', enum: ['ru', 'en'], example: 'en' },
            timezone: { type: 'string', example: 'Europe/Moscow' },
            notifications: { type: 'boolean', example: false }
          }
        },

        Link: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            originalUrl: { type: 'string', example: 'https://example.com' },
            shortCode: { type: 'string', example: 'abc123' },
            alias: { type: 'string', nullable: true, example: 'my-link' },
            expiresAt: { type: 'integer', nullable: true, example: 1735689600000 },
            password: { type: 'string', nullable: true, example: null },
            groupId: { type: 'integer', nullable: true, example: 1 },
            utmParams: { type: 'object', nullable: true, example: { source: 'facebook', medium: 'social' } },
            clicks: { type: 'integer', example: 42 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'integer', example: 1640995200000 },
            deletedAt: { type: 'integer', nullable: true, example: null }
          }
        },
        CreateLinkRequest: {
          type: 'object',
          required: ['originalUrl'],
          properties: {
            originalUrl: { type: 'string', example: 'https://example.com' },
            alias: { type: 'string', example: 'my-link' },
            expiresAt: { type: 'string', format: 'date-time', example: '2025-12-31T23:59:59Z' },
            password: { type: 'string', example: 'secret123' },
            groupId: { type: 'integer', example: 1 },
            utmParams: { 
              type: 'object', 
              example: { source: 'facebook', medium: 'social', campaign: 'sale' }
            },
            algorithm: { type: 'string', enum: ['random', 'base64'], example: 'random' }
          }
        },
        UpdateLinkRequest: {
          type: 'object',
          properties: {
            originalUrl: { type: 'string', example: 'https://new-example.com' },
            alias: { type: 'string', example: 'new-alias' },
            expiresAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00Z' },
            password: { type: 'string', nullable: true, example: null },
            groupId: { type: 'integer', nullable: true, example: 2 },
            isActive: { type: 'boolean', example: true }
          }
        },
        LinksListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Link' }
            },
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 5 }
          }
        },

        Group: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Маркетинг' },
            description: { type: 'string', example: 'Ссылки для рекламных кампаний' },
            createdAt: { type: 'integer', example: 1640995200000 }
          }
        },
        CreateGroupRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Маркетинг' },
            description: { type: 'string', example: 'Ссылки для рекламных кампаний' }
          }
        },
        UpdateGroupRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Новое название' },
            description: { type: 'string', example: 'Новое описание' }
          }
        },
        GroupWithLinks: {
          allOf: [
            { $ref: '#/components/schemas/Group' },
            {
              type: 'object',
              properties: {
                links: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Link' }
                }
              }
            }
          ]
        },

        AnalyticsSummary: {
          type: 'object',
          properties: {
            link: { type: 'string', example: 'abc123' },
            totalClicks: { type: 'integer', example: 100 },
            uniqueVisitors: { type: 'integer', example: 75 },
            daily: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: { '2024-01-01': 10, '2024-01-02': 15 }
            },
            geo: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: { 'BY': 30, 'RU': 25, 'US': 20 }
            },
            devices: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: { 'Desktop': 40, 'Mobile': 50, 'Tablet': 10 }
            },
            referrers: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: { 'direct': 30, 'google.com': 25, 'facebook.com': 20 }
            }
          }
        },
        OverviewStats: {
          type: 'object',
          properties: {
            totalLinks: { type: 'integer', example: 50 },
            activeLinks: { type: 'integer', example: 35 },
            totalClicks: { type: 'integer', example: 1000 },
            mostPopular: {
              type: 'object',
              properties: {
                shortCode: { type: 'string', example: 'abc123' },
                clicks: { type: 'integer', example: 200 }
              }
            }
          }
        },
        Click: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            linkId: { type: 'integer', example: 1 },
            ip: { type: 'string', example: '192.168.1.1' },
            userAgent: { type: 'string', example: 'Mozilla/5.0 ...' },
            referer: { type: 'string', example: 'https://google.com' },
            location: {
              type: 'object',
              properties: {
                country: { type: 'string', example: 'BY' },
                city: { type: 'string', example: 'Minsk' }
              }
            },
            timestamp: { type: 'integer', example: 1640995200000 }
          }
        },
        ClicksListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Click' }
            },
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 5 }
          }
        },

        // ---------- QR И ПРЕВЬЮ ----------
        QRResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'QR-код будет сгенерирован' },
            url: { type: 'string', example: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=abc123' }
          }
        },
        PreviewResponse: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Заголовок страницы' },
            description: { type: 'string', example: 'Описание страницы' },
            image: { type: 'string', example: 'https://example.com/image.jpg' }
          }
        },

        VerifyPasswordRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string', example: 'secret123' }
          }
        },
        VerifyPasswordResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Пароль верен' },
            redirectUrl: { type: 'string', example: 'https://example.com' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Аутентификация и управление токенами' },
      { name: 'Users', description: 'Профиль и настройки пользователя' },
      { name: 'Links', description: 'Управление ссылками' },
      { name: 'Groups', description: 'Группы для организации ссылок' },
      { name: 'Analytics', description: 'Статистика и аналитика переходов' },
      { name: 'Redirect', description: 'Публичные эндпоинты для перехода по ссылкам' }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'] 
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;