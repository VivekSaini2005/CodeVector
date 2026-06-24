import axiosInstance from '../api/axiosInstance';

export const getProducts = ({ category, cursor, snapshotTime, limit = 20 } = {}) => {
	return axiosInstance
		.get('/products', {
			params: {
				category,
				cursor,
				snapshotTime,
				limit
			}
		})
		.then((response) => response.data);
};