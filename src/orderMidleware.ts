// import { DraftOrderModel } from "./orm";
// import { ModelTypes, ResolverInputTypes } from "./zeus";



  
// export const resolveMongoTimeFilterFromInput = (period: ResolverInputTypes['TimeFilter']) => {
//     return {
//       createdAt: {
//         $gte: new Date(period.from as string),
//         ...(period.to
//           ? {
//               $lte: new Date(period.to as string),
//             }
//           : {}),
//       },
//     };
//   };



  
//   export const find = async (col, filter, opts) => await coursorFind(col, filter, opts).then((c) => c.toArray());

//   export const OrderOrm = (db: Db) => ({
//     list: (
//       filters: Filter<DraftOrderModel>,
//       paginate?: ModelTypes['PageOptions'],
//       sort?: Sort,
//     ): Promise<ModelTypes['Order'][]> =>
//       (
//         find(
//           Order,
//           {
//             ...filters,
//             tenant,
//             ...cursorFilter(sort, paginate?.cursorId),
//           },
//           {
//             ...(paginate?.limit && { limit: paginate?.limit }),
//             sort,
//             ...((sort as [string, SortDirection])[0] !== '_id' &&
//               paginate?.cursorId && { skip: parseInt(paginate?.cursorId) }),
//           },
//         ),
//     )
//   })



//   export const preparedSort = (sort?: { field?: string | null; order?: string | null } | null): Sort => {
//     const direction = (sort?.order?.toLowerCase() || 'desc') as SortDirection;
//     const sortById = ['_id', direction];
//     return (
//       sort?.field && sort.field !== SortOrdersField.CREATED_AT
//         ? [[snakeCaseToCamelCase(sort.field), direction], sortById]
//         : sortById
//     ) as Sort;
//   };

//   export const useOrderOrm = () => DB().then((db) => OrderOrm(db));


//   export function paginateOrders(
//     objects: ModelTypes['Order'][],
//     limit: number | undefined,
//     cursor?: number,
//   ): PaginatedResult<ModelTypes['Order']> {
//     let cursorId = undefined;
//     if (limit === objects.length) {
//       objects.pop();
//       cursorId = cursor?.toString() || objects[limit > 2 ? limit - 2 : 0]?.id;
//     }
//     const result: PaginatedResult<ModelTypes['Order']> = {
//       cursorId,
//     };
  
//     result['orders'] = objects;
//     return result;
//   }
  


//   export const skipCursorForSortByField = (filter: any) =>
//     filter?.sort?.field && filter.sort.field !== SortOrdersField.CREATED_AT
//       ? parseInt(filter.paginate?.cursorId || '0') + (filter.paginate?.limit || 0)
//       : undefined;


//       export const adminOrderFilterToFilter = async (
//         {
//           clientId,
//           paymentFrom,
//           period,
//           status,
//           direction,
//           units,
//           deliveryType,
//           ownerType,
//           fromDoor,
//           toDoor,
//           searchString,
//         }: Omit<ResolverInputTypes['AdminOrderFilter'], 'paginate'>,
//       ) => {
    
//         return {
//           ...(restaurant?.length && { restaurant: { $in: restaurant } }),
//           ...(driver?.length && { driver: { $in: driver } }),
//           ...(payment?.length && { payment: { $in: payment } }),
//           ...(status?.length && status[0] && { status: { $in: status } }),
//           ...(period && resolveMongoTimeFilterFromInput(period)),
//           ...(settled && { settled: settled ? tenant : null }),
//           ...(searchString && searchDisplayOrderId
//             ? {
//                 $or: [
//                   {
//                     $and: searchDisplayPartnerId
//                       ? [
//                           { 'displayId.2': parseInt(searchDisplayOrderId) },
//                           { 'displayId.1': parseInt(searchDisplayPartnerId) },
//                         ]
//                       : [{ 'displayId.2': parseInt(searchDisplayOrderId) }],
//                   },
//                   { total: Math.round(parseFloat(searchString.replace(',', '.')) * 100) },
//                   { restaurant: { $in: findedRestaurants?.map((r) => r.ownerUsername) || [] } },
//                   { 'address.addressGoogleString': { $regex: searchString, $options: 'i' } },
//                 ],
//               }
//             : {}),
//         };
//       };
      
  