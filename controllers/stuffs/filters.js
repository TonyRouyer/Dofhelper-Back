// Fonction utilitaire pour le filtre de recherche par nom
exports.searchFilter = (query) => {
    if (query && query.search !== undefined) {
        const searchString = query.search;
        const regex = new RegExp(searchString, 'i');
        return { name: { $regex: regex } };
    }
    return {};
};

// Fonction utilitaire pour le filtre de limite
exports.limitFilter = (query) => {
    return query && query.limit ? parseInt(query.limit) : 15;
};