import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdminServices, addAdminService, updateAdminService, deleteAdminService } from './adminServices.js';

test('admin services CRUD updates the in-memory list', () => {
  const initial = getAdminServices();
  const created = addAdminService({ name: 'Prueba', price: 150 });

  assert.equal(created.name, 'Prueba');
  assert.equal(created.price, 150);
  assert.equal(getAdminServices().length, initial.length + 1);

  updateAdminService(created.id, { price: 250 });
  const updated = getAdminServices().find((service) => service.id === created.id);
  assert.equal(updated.price, 250);

  deleteAdminService(created.id);
  assert.equal(getAdminServices().find((service) => service.id === created.id), undefined);
});
