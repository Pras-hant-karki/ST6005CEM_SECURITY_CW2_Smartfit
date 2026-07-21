/**
 * Admin — self-service profile management.
 * Doctor account management and department management are documented
 * under the Doctor and Department tags respectively (see doctor.docs.js,
 * department.docs.js), since they operate on those resources.
 * Pure documentation module (see swagger.js).
 */

/**
 * @openapi
 * /admin/update-profile:
 *   patch:
 *     summary: Update the authenticated admin's profile
 *     description: At least one field is required.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UpdateAdminProfileRequest' } } }
 *     responses:
 *       200: { description: Profile updated., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/AdminProfile' } } }] } } } }
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /admin/update-profilepicture:
 *   patch:
 *     summary: Update the authenticated admin's profile picture
 *     tags: [Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [profilepicture], properties: { profilepicture: { type: string, format: binary } } }
 *     responses:
 *       200: { description: Profile picture updated. }
 *       400: { description: Missing or invalid file. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */

/**
 * @openapi
 * /admin/get-profile:
 *   get:
 *     summary: Get the authenticated admin's full profile
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profile fetched., content: { application/json: { schema: { allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/AdminProfile' } } }] } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @openapi
 * /admin/get-admin:
 *   get:
 *     summary: Get the currently authenticated admin (session check)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current admin returned. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
