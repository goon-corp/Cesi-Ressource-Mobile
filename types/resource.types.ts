export interface ResourceTypeInfo {
  id: string;
  label: string;
}

export interface ResourceStatusInfo {
  id: string;
  label: string;
}

export interface ResourceConfidentialityTypeInfo {
  id: string;
  label: string;
}

export interface TagDto {
  id: string;
  label: string;
}

export interface ApiResource {
  id: string;
  title: string;
  description: string;
  thumbnailId?: string;
  status?: ResourceStatusInfo;
  confidentialityType?: ResourceConfidentialityTypeInfo;
  type?: ResourceTypeInfo;
  tags: TagDto[];
}

export interface ApiEvent {
  id: string;
  isVirtual: boolean;
  dateStart: string;
  dateEnd: string;
  eventLink?: string;
  location: string;
  ressource: ApiResource;
}
