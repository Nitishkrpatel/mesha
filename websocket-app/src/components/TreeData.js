const blocksData = [
  { id: 1, label: "Block 1" },
  { id: 8, label: "Block 2" },
];

const floorsData = [
  { id: 2, parentId: 1, label: "Floor 1" },
  { id: 5, parentId: 1, label: "Floor 2" },
  { id: 9, parentId: 8, label: "Floor 1" },
  { id: 12, parentId: 8, label: "Floor 2" },
];

const apartmentsData = [
  { id: 3, parentId: 2, label: "Apartment 101" },
  { id: 4, parentId: 2, label: "Apartment 102" },
  { id: 6, parentId: 5, label: "Apartment 201" },
  { id: 7, parentId: 5, label: "Apartment 202" },
  { id: 10, parentId: 9, label: "Apartment 301" },
  { id: 11, parentId: 9, label: "Apartment 302" },
  { id: 13, parentId: 12, label: "Apartment 401" },
  { id: 14, parentId: 12, label: "Apartment 402" },
];

const organizeData = (blocks, floors, apartments) => {
  const treeData = [];

  blocks.forEach((block) => {
    const blockNode = { ...block, children: [] };

    const blockFloors = floors.filter((floor) => floor.parentId === block.id);

    blockFloors.forEach((floor) => {
      const floorNode = { ...floor, children: [] };

      const floorApartments = apartments.filter(
        (apartment) => apartment.parentId === floor.id
      );

      floorNode.children = floorApartments;

      blockNode.children.push(floorNode);
    });

    treeData.push(blockNode);
  });

  return treeData;
};

const treeData = organizeData(blocksData, floorsData, apartmentsData);
export default treeData;
