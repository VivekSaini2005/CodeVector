import axiosInstance from '../api/axiosInstance';

export const getProducts = ({ category, cursor, snapshotTime } = {}) => {
	return axiosInstance
		.get('/products', {
			params: {
				category,
				cursor,
				snapshotTime
			}
		})
		.then((response) => response.data);
};