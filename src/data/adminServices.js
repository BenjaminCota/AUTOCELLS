const defaultServices = [
  {
    id: 'liberacion-rsim',
    name: 'Liberación de celulares por R-SIM',
    price: 300,
    description: 'Servicio principal de liberación para iPhone.',
  },
];

let adminServices = defaultServices.map((service) => ({ ...service }));

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getAdminServices() {
  return adminServices;
}

export function addAdminService(data) {
  const newService = {
    id: `${slugify(data.name)}-${Date.now().toString(36)}`,
    name: data.name.trim(),
    price: Number(data.price),
    description: data.description?.trim() ?? '',
  };

  adminServices = [newService, ...adminServices];
  return newService;
}

export function updateAdminService(id, data) {
  adminServices = adminServices.map((service) =>
    service.id === id
      ? {
          ...service,
          ...data,
          name: data.name?.trim() ?? service.name,
          price: Number(data.price ?? service.price),
          description: data.description?.trim() ?? service.description ?? '',
        }
      : service,
  );
}

export function deleteAdminService(id) {
  adminServices = adminServices.filter((service) => service.id !== id);
}
