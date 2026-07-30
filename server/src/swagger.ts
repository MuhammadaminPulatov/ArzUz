import swaggerUi from 'swagger-ui-express'
import type { Express } from 'express'

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'MahallFix API',
    version: '1.0.0',
    description:
      'Toshkent mahalla muammolari uchun Telegram Mini App backend API.\n\n' +
      '**Autentifikatsiya:** Barcha himoyalangan endpointlar `Authorization: Bearer <JWT>` talab qiladi.\n\n' +
      'JWT olish uchun avval `POST /api/auth/telegram` ga Telegram `initData` yuboring.',
  },
  servers: [
    { url: 'https://mahallfix-api.vercel.app', description: 'Production' },
    { url: 'http://localhost:3001',            description: 'Local dev' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      OkEnvelope: {
        type: 'object',
        properties: {
          ok:   { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
      ErrEnvelope: {
        type: 'object',
        properties: {
          ok:    { type: 'boolean', example: false },
          error: { type: 'string',  example: 'Invalid token' },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          ticketId:          { type: 'string',  example: 'MFX-2026-00012' },
          userId:            { type: 'string',  example: '8313288034' },
          username:          { type: 'string',  example: 'Muhammadamin_Pulatov' },
          firstName:         { type: 'string',  example: 'Muhammadamin' },
          photoUrl:          { type: 'string',  example: 'https://blob.vercel-storage.com/...' },
          category:          { type: 'string',  example: 'road' },
          categoryLabel:     { type: 'string',  example: "Yo'l nosozligi" },
          severity:          { type: 'string',  enum: ['low', 'medium', 'high'], example: 'medium' },
          aiTitle:           { type: 'string',  example: "Ko'cha yo'lida chuqur" },
          aiDescription:     { type: 'string',  example: 'Asosiy ko\'cha yo\'lida katta chuqur bor...' },
          department:        { type: 'string',  example: "Yo'l xo'jaligi boshqarmasi" },
          aiConfidence:      { type: 'number',  example: 92 },
          lat:               { type: 'number',  example: 41.2995 },
          lng:               { type: 'number',  example: 69.2401 },
          address:           { type: 'string',  example: 'Chilonzor tumani, 3-mavze' },
          district:          { type: 'string',  example: 'chilonzor' },
          status:            { type: 'string',  enum: ['new','sent','in_progress','resolved','rejected'], example: 'new' },
          priority:          { type: 'string',  enum: ['normal','high','critical'], example: 'normal' },
          votes:             { type: 'integer', example: 5 },
          createdAt:         { type: 'string',  format: 'date-time' },
          updatedAt:         { type: 'string',  format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          telegramId:    { type: 'string',  example: '8313288034' },
          firstName:     { type: 'string',  example: 'Muhammadamin' },
          username:      { type: 'string',  example: 'Muhammadamin_Pulatov' },
          xp:            { type: 'integer', example: 750 },
          streak:        { type: 'integer', example: 3 },
          plan:          { type: 'string',  enum: ['free','premium'], example: 'free' },
          reportCount:   { type: 'integer', example: 5 },
          resolvedCount: { type: 'integer', example: 2 },
          badges:        { type: 'array', items: { type: 'string' }, example: ['first_report'] },
          isAdmin:       { type: 'boolean', example: false },
        },
      },
      AIResult: {
        type: 'object',
        properties: {
          category:      { type: 'string',  example: 'road' },
          severity:      { type: 'string',  enum: ['low','medium','high'] },
          aiTitle:       { type: 'string',  example: "Asfalt buzilgan" },
          aiDescription: { type: 'string',  example: 'Ko\'cha qoplamasi...' },
          department:    { type: 'string',  example: "Yo'l xo'jaligi boshqarmasi" },
          confidence:    { type: 'integer', example: 88 },
        },
      },
    },
  },
  paths: {
    // ── HEALTH ──────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Server holati',
        responses: {
          '200': {
            description: 'Server ishlayabdi',
            content: { 'application/json': { example: { ok: true, ts: 1722340800000 } } },
          },
        },
      },
    },

    // ── AUTH ─────────────────────────────────────────────────────────────────
    '/api/auth/telegram': {
      post: {
        tags: ['Auth'],
        summary: 'Telegram initData orqali tizimga kirish',
        description:
          'Telegram WebApp `initData` ni tekshirib, JWT token qaytaradi. ' +
          'Foydalanuvchi bazada bo\'lmasa, avtomatik yaratiladi.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['initData'],
                properties: { initData: { type: 'string', description: 'Telegram.WebApp.initData' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Muvaffaqiyatli login',
            content: {
              'application/json': {
                example: {
                  ok: true,
                  data: {
                    token: 'eyJ...',
                    user: {
                      telegramId: '8313288034', username: 'Muhammadamin_Pulatov',
                      firstName: 'Muhammadamin', xp: 750, plan: 'free',
                      isAdmin: true, isSuperAdmin: false,
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Noto\'g\'ri initData' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Joriy foydalanuvchi ma\'lumotlari',
        description: 'Birinchi kunda +50 XP streak mukofoti beriladi.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Foydalanuvchi + uning ticketlari',
            content: {
              'application/json': {
                example: {
                  ok: true,
                  data: {
                    telegramId: '8313288034', firstName: 'Muhammadamin',
                    xp: 750, streak: 3, plan: 'free', reportCount: 5,
                    isAdmin: true, tickets: [],
                  },
                },
              },
            },
          },
          '401': { description: 'Token yo\'q yoki noto\'g\'ri' },
        },
      },
    },
    '/api/auth/leaderboard': {
      get: {
        tags: ['Auth'],
        summary: 'Top foydalanuvchilar reytingi',
        parameters: [
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10, maximum: 50 }, description: 'Nechta ko\'rsatilsin' },
        ],
        responses: {
          '200': {
            description: 'XP bo\'yicha saralangan foydalanuvchilar',
            content: {
              'application/json': {
                example: {
                  ok: true,
                  data: [
                    { rank: 1, telegramId: '8313288034', firstName: 'Muhammadamin', xp: 750, reportCount: 5, badges: [] },
                  ],
                },
              },
            },
          },
        },
      },
    },

    // ── TICKETS ──────────────────────────────────────────────────────────────
    '/api/tickets': {
      get: {
        tags: ['Tickets'],
        summary: 'Barcha ticketlar (ommaviy)',
        parameters: [
          { in: 'query', name: 'page',     schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit',    schema: { type: 'integer', default: 20, maximum: 50 } },
          { in: 'query', name: 'category', schema: { type: 'string' }, example: 'road' },
          { in: 'query', name: 'district', schema: { type: 'string' }, example: 'chilonzor' },
          { in: 'query', name: 'status',   schema: { type: 'string', enum: ['new','sent','in_progress','resolved','rejected'] } },
        ],
        responses: {
          '200': {
            description: 'Ticket ro\'yxati',
            content: {
              'application/json': {
                example: { ok: true, data: { tickets: [], total: 3, page: 1, limit: 20 } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Tickets'],
        summary: 'Yangi ticket yaratish (+150 XP)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lat', 'lng', 'address', 'category', 'categoryLabel'],
                properties: {
                  photoUrl:      { type: 'string' },
                  category:      { type: 'string', example: 'road' },
                  categoryLabel: { type: 'string', example: "Yo'l nosozligi" },
                  severity:      { type: 'string', enum: ['low','medium','high'], default: 'medium' },
                  aiTitle:       { type: 'string' },
                  aiDescription: { type: 'string' },
                  department:    { type: 'string' },
                  lat:           { type: 'number', example: 41.2995 },
                  lng:           { type: 'number', example: 69.2401 },
                  address:       { type: 'string', example: 'Chilonzor tumani, 3-mavze' },
                  district:      { type: 'string' },
                  userNote:      { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Ticket yaratildi' },
          '400': { description: 'Majburiy maydonlar yo\'q' },
          '401': { description: 'Autentifikatsiya talab qilinadi' },
          '429': { description: 'Soatiga 5 ta limitga yetdi' },
        },
      },
    },
    '/api/tickets/{id}': {
      get: {
        tags: ['Tickets'],
        summary: 'Bitta ticket',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Ticket topildi' },
          '404': { description: 'Topilmadi' },
        },
      },
    },
    '/api/tickets/{id}/vote': {
      post: {
        tags: ['Tickets'],
        summary: 'Ticketga ovoz berish',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Ovoz qabul qilindi', content: { 'application/json': { example: { ok: true, data: { votes: 6 } } } } },
          '409': { description: 'Allaqachon ovoz berilgan' },
        },
      },
    },
    '/api/tickets/{id}/status': {
      patch: {
        tags: ['Tickets'],
        summary: 'Ticket statusini o\'zgartirish (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['status'],
                properties: { status: { type: 'string', enum: ['new','sent','in_progress','resolved','rejected'] } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Status yangilandi (+300 XP yaratuvchiga)' },
          '403': { description: 'Admin emas' },
        },
      },
    },

    // ── UPLOAD ───────────────────────────────────────────────────────────────
    '/api/upload': {
      post: {
        tags: ['Upload'],
        summary: 'Rasm yuklash + Gemini AI tahlil',
        description:
          'Rasmni Vercel Blob ga yuklaydi va Gemini 2.5 Flash orqali tahlil qiladi. ' +
          'AI natijasi: kategoriya, og\'irlik darajasi, sarlavha, tavsif, bo\'lim.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { photo: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Rasm yuklandi',
            content: {
              'application/json': {
                example: {
                  ok: true,
                  data: {
                    url: 'https://blob.vercel-storage.com/photo.jpg',
                    thumbnailUrl: 'https://blob.vercel-storage.com/photo-thumb.jpg',
                    ai: {
                      category: 'road', severity: 'medium', confidence: 91,
                      aiTitle: "Asfalt buzilgan", aiDescription: "Ko'cha qoplamasi...",
                      department: "Yo'l xo'jaligi boshqarmasi",
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Rasm yuklanmadi' },
          '401': { description: 'Token talab qilinadi' },
        },
      },
    },

    // ── ADMIN ────────────────────────────────────────────────────────────────
    '/api/admin/tickets': {
      get: {
        tags: ['Admin'],
        summary: 'Admin: barcha ticketlar',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page',     schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit',    schema: { type: 'integer', default: 50, maximum: 100 } },
          { in: 'query', name: 'status',   schema: { type: 'string' } },
          { in: 'query', name: 'district', schema: { type: 'string' } },
          { in: 'query', name: 'priority', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Admin ticket ro\'yxati' },
          '403': { description: 'Admin huquqi yo\'q' },
        },
      },
    },
    '/api/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'Admin: statistika',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Umumiy statistika',
            content: {
              'application/json': {
                example: {
                  ok: true,
                  data: { total: 42, byStatus: { new: 10, in_progress: 20, resolved: 12 }, avgResolutionDays: 3 },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/tickets/{id}/assign': {
      patch: {
        tags: ['Admin'],
        summary: 'Admin: tashkilotga biriktirish',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  orgId:   { type: 'string', example: 'org-2' },
                  orgName: { type: 'string', example: "Yo'l qurilish boshqarmasi" },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Biriktirildi' }, '403': { description: 'Admin emas' } },
      },
    },
    '/api/admin/tickets/{id}/resolve': {
      patch: {
        tags: ['Admin'],
        summary: 'Admin: hal qilindi deb belgilash (+300 XP yaratuvchiga)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Hal qilindi' }, '403': { description: 'Admin emas' } },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Admin: foydalanuvchilar ro\'yxati',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page',  schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'Foydalanuvchilar ro\'yxati' } },
      },
    },

    // ── SUPER ADMIN ──────────────────────────────────────────────────────────
    '/api/superadmin/stats': {
      get: {
        tags: ['Super Admin'],
        summary: 'Super Admin: tizim statistikasi',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Platforma umumiy ko\'rsatkichlari',
            content: {
              'application/json': {
                example: { ok: true, data: { totalUsers: 120, totalTickets: 450, totalXpAwarded: 67500 } },
              },
            },
          },
          '403': { description: 'Super Admin huquqi yo\'q' },
        },
      },
    },
    '/api/superadmin/admins': {
      get: {
        tags: ['Super Admin'],
        summary: 'Super Admin: adminlar ro\'yxati',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Admin foydalanuvchilar' } },
      },
      post: {
        tags: ['Super Admin'],
        summary: 'Super Admin: admin tayinlash',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['telegramId'],
                properties: { telegramId: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Admin tayinlandi' } },
      },
    },

    // ── ORG ─────────────────────────────────────────────────────────────────
    '/api/org': {
      get: {
        tags: ['Organizations'],
        summary: 'Tashkilotlar ro\'yxati',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Toshkent kommunal tashkilotlari' } },
      },
    },

    // ── SSE ──────────────────────────────────────────────────────────────────
    '/api/sse': {
      get: {
        tags: ['Real-time'],
        summary: 'Server-Sent Events stream',
        description:
          'Real vaqt yangiliklar: `ticket:created`, `ticket:updated`, `ticket:voted`.\n\n' +
          'Ulanish: `EventSource("https://mahallfix-api.vercel.app/api/sse?token=JWT")`',
        parameters: [
          { in: 'query', name: 'token', required: true, schema: { type: 'string' }, description: 'JWT token' },
        ],
        responses: {
          '200': {
            description: 'text/event-stream — uzluksiz oqim',
            content: { 'text/event-stream': { example: 'data: {"type":"ticket:created","payload":{...}}\n\n' } },
          },
        },
      },
    },
  },
  tags: [
    { name: 'System',        description: 'Server holati' },
    { name: 'Auth',          description: 'Telegram autentifikatsiya va foydalanuvchi' },
    { name: 'Tickets',       description: 'Muammo ticketlari (ariza)' },
    { name: 'Upload',        description: 'Rasm yuklash va AI tahlil' },
    { name: 'Admin',         description: 'Admin panel endpointlari (admin JWT talab)' },
    { name: 'Super Admin',   description: 'Super admin (alohida ruxsat talab)' },
    { name: 'Organizations', description: 'Kommunal tashkilotlar' },
    { name: 'Real-time',     description: 'SSE real vaqt yangiliklar' },
  ],
}

export function setupSwagger(app: Express) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'MahallFix API Docs',
      customCss: `
        .swagger-ui .topbar { background: linear-gradient(135deg,#3B82F6,#6366F1); }
        .swagger-ui .topbar-wrapper .link { display: none; }
        .swagger-ui .info .title { color: #1e3a8a; }
      `,
      swaggerOptions: { persistAuthorization: true },
    }),
  )

  // Raw JSON spec endpoint
  app.get('/api/docs.json', (_req, res) => {
    res.json(spec)
  })
}
