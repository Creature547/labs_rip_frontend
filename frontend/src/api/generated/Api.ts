/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Equipment {
  id: number;
  name: string;
  description: string;
  power: number;
  cost: number;
  image_url: string;
  video_url: string;
  is_creator: number;
  liked: number;
  likes_count: number;
}

export interface User {
  id?: number;
  login?: string;
}

export interface Credentials {
  /** @example "anna_lab4" */
  login: string;
  /** @example "lab4pass" */
  password: string;
}

export interface Like {
  like: 0 | 1;
}

export interface Publication {
  id?: number;
  name?: string;
  description?: string;
  power?: number;
  cost?: number;
  image_url?: string;
  video_url?: string;
  is_creator?: number;
  liked?: number;
  likes_count?: number;
  status?: "опубликован";
  /** @format date-time */
  formed_at?: string;
}

export interface AuthResponse {
  access_token?: string;
  /** @example "Bearer" */
  token_type?: string;
  /** @example 3600 */
  expires_in?: number;
  user?: User;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Отопительные приборы — ЛР4
 * @version 4.0
 * @baseUrl /api
 *
 * Go / Gin / PostgreSQL / MinIO / Redis. В Authorize вводить Bearer и JWT через пробел. Гостю доступны опубликованные приборы и лента. Регистрация и вход открыты.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  heatingEquipment = {
    /**
     * @description Доступен гостю и с любым токеном. Невалидный токен считается гостевым режимом.
     *
     * @tags Приборы
     * @name HeatingEquipmentList
     * @summary Список опубликованных приборов с фильтром
     * @request GET:/heating-equipment
     */
    heatingEquipmentList: (
      query?: {
        name?: string;
        min_power?: number;
        max_cost?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Equipment[], void>({
        path: `/heating-equipment`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description creator_id берётся из проверенного JWT. power и cost больше нуля. Один черновик на пользователя.  Аутентификация: Authorization: Bearer JWT.
     *
     * @tags Приборы
     * @name HeatingEquipmentCreateDraft
     * @summary Создать черновик с фото и видео
     * @request POST:/heating-equipment
     * @secure
     */
    heatingEquipmentCreateDraft: (
      data: {
        name: string;
        description?: string;
        power: number;
        cost: number;
        /** @format binary */
        image: File;
        /** @format binary */
        video: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<Equipment, void>({
        path: `/heating-equipment`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * @description  Аутентификация: Authorization: Bearer JWT.
     *
     * @tags Приборы
     * @name HeatingEquipmentDraft
     * @summary Получить свой черновик
     * @request GET:/heating-equipment/draft
     * @secure
     */
    heatingEquipmentDraft: (params: RequestParams = {}) =>
      this.request<Equipment, void>({
        path: `/heating-equipment/draft`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Меняет status на опубликован и заполняет formed_at. Тело не нужно. Чужой или уже опубликованный прибор — 404.  Аутентификация: Authorization: Bearer JWT.
     *
     * @tags Приборы
     * @name HeatingEquipmentPublish
     * @summary Опубликовать свой черновик
     * @request PUT:/heating-equipment/{id}/publish
     * @secure
     */
    heatingEquipmentPublish: (id: number, params: RequestParams = {}) =>
      this.request<Publication, void>({
        path: `/heating-equipment/${id}/publish`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description  Аутентификация: Authorization: Bearer JWT.
     *
     * @tags Приборы
     * @name HeatingEquipmentDelete
     * @summary Мягко удалить свой прибор
     * @request DELETE:/heating-equipment/{id}
     * @secure
     */
    heatingEquipmentDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/heating-equipment/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description  Аутентификация: Authorization: Bearer JWT.
     *
     * @tags Приборы
     * @name HeatingEquipmentLike
     * @summary Поставить или снять лайк
     * @request POST:/heating-equipment/{id}/like
     * @secure
     */
    heatingEquipmentLike: (
      id: number,
      body: Like,
      params: RequestParams = {},
    ) =>
      this.request<Equipment, void>({
        path: `/heating-equipment/${id}/like`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Приборы
     * @name HeatingEquipmentFeed
     * @summary Первый прибор в ленте
     * @request GET:/heating-equipment/feed
     */
    heatingEquipmentFeed: (params: RequestParams = {}) =>
      this.request<Equipment, void>({
        path: `/heating-equipment/feed`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description next=true возвращает следующий по ID; после последнего — первый.
     *
     * @tags Приборы
     * @name HeatingEquipmentFeedById
     * @summary Прибор по ID или следующий
     * @request GET:/heating-equipment/feed/{id}
     */
    heatingEquipmentFeedById: (
      id: number,
      query?: {
        next?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<Equipment, void>({
        path: `/heating-equipment/feed/${id}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
}
