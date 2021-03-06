import {StringMap} from '../Type/StringMap';
import {HttpMethod} from '../Type/HttpMethod';
import {PlainObject} from '../Type/PlainObject';
import {HttpRequestSettings} from '../Type/HttpRequestSettings';
import {HttpMethods} from '../Enum/HttpMethods';
import {HttpHeaders} from '../Enum/HttpHeaders';
import {MediaTypes} from '../Enum/MediaTypes';
import {Httpr} from './Httpr';
import {HttprInterceptor} from './HttprInterceptor';
import {urlJoin} from './HttprUtils';
import {HttpResponse} from '../Type/HttpResponse';
import {HttprBody} from './HttprBody';

/**
 * Static methods used in Httpr for preparing requests and managing interceptors.
 */
export class HttprStatic {
  /**
   * Prepare request settings and apply interceptors before sending the request.
   *
   * @param {Httpr} instance - instance of Http
   * @param {HttpMethod} method - http method to use.
   * @param {string} url - url of resource to request.
   * @param {PlainObject} params - hash of additional query parameters.
   * @param {StringMap} headers - hash of request headers to set.
   * @param {*} body - request body data.
   * @returns {HttpRequestSettings} prepared request settings.
   */
  public static build(instance: Httpr, method: HttpMethod, url: string, params?: PlainObject,
                      headers?: StringMap, body?: any): HttpRequestSettings {
    let settings: HttpRequestSettings = {
      method: method || HttpMethods.GET,
      url: urlJoin(instance.config.baseUrl, url) || '',
      headers: headers || {},
      params: params || {}
    };

    if (body) {
      if (body instanceof HttprBody) {
        settings.headers[HttpHeaders.CONTENT_TYPE] = body.type;
        settings.body = body.toString();
      } else if (settings.headers[HttpHeaders.CONTENT_TYPE]) {
        settings.body = body;
      } else if (typeof body === 'object') {
        settings.headers[HttpHeaders.CONTENT_TYPE] = MediaTypes.APPLICATION_JSON;
        settings.body = JSON.stringify(body);
      } else {
        settings.headers[HttpHeaders.CONTENT_TYPE] = MediaTypes.TEXT_PLAIN;
        settings.body = body;
      }
    }

    instance.interceptors.forEach((interceptor: HttprInterceptor) => {
      settings = interceptor.beforeRequest(settings);
    });

    return settings;
  }

  /**
   * Receive success response and apply interceptors.
   *
   * @returns {Promise<HttpResponse>} resolution handler.
   */
  public static onSuccess(instance: Httpr, response: HttpResponse): Promise<HttpResponse> {
    let _response = response;

    instance.interceptors.forEach((interceptor: HttprInterceptor) => {
      _response = interceptor.afterSuccess(_response);
    });

    return Promise.resolve(_response);
  }

  /**
   * Receive error response and apply interceptors.
   *
   * @returns {Promise<HttpResponse>} rejection handler.
   */
  public static onError(instance: Httpr, response: HttpResponse): Promise<HttpResponse> {
    let _response = response;

    instance.interceptors.forEach((interceptor: HttprInterceptor) => {
      _response = interceptor.afterError(_response);
    });

    return Promise.reject(_response);
  }
}
