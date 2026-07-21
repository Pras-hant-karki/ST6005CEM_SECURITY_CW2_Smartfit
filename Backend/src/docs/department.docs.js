/**
 * Department — hospital department directory.
 * (Department-scoped doctor listings are documented under the Doctor tag —
 * see doctor.docs.js.)
 * Pure documentation module (see swagger.js).
 */

/**
 * @openapi
 * /patient/departments:
 *   get:
 *     summary: List all departments (public)
 *     tags: [Department]
 *     responses:
 *       200:
 *         description: All departments.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/Department' } } } }]
 */

/**
 * @openapi
 * /admin/departments:
 *   get:
 *     summary: List all departments (admin)
 *     tags: [Department, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All departments.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { type: array, items: { $ref: '#/components/schemas/Department' } } } }]
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @openapi
 * /admin/create-department:
 *   post:
 *     summary: Create a department (admin)
 *     tags: [Department, Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/CreateDepartmentRequest' } } }
 *     responses:
 *       201:
 *         description: Department created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Department' } } }]
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       409:
 *         description: A department with the same name already exists.
 */

/**
 * @openapi
 * /admin/update-department/{id}:
 *   patch:
 *     summary: Update a department (admin)
 *     tags: [Department, Admin]
 *     security: [{ bearerAuth: [], csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UpdateDepartmentRequest' } } }
 *     responses:
 *       200:
 *         description: Department updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf: [{ $ref: '#/components/schemas/StandardSuccessResponse' }, { type: object, properties: { data: { $ref: '#/components/schemas/Department' } } }]
 *       400: { $ref: '#/components/responses/ValidationFailed' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/CsrfRejected' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
