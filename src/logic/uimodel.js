import { map, filter, startWith } from 'rxjs/operators';
import { glTF } from '../gltf.js';
import { ToneMaps, DebugOutput } from '../Renderer/rendering_parameters';

// this class wraps all the observables for the gltf sample viewer state
// the data streams coming out of this should match the data required in GltfState
// as close as possible
class UIModel
{
    constructor(app, modelPathProvider)
    {
        this.app = app;
        this.pathProvider = modelPathProvider;

        this.app.models = this.pathProvider.getAllKeys().map(key => {
            return {title: key};
        });

        this.model = app.modelChanged$.pipe(
            map(event => event.event.msg),
            startWith("Avocado"),
            map(value => this.pathProvider.resolve(value)),
        );
        this.flavour = app.flavourChanged$.pipe(map(value => value.event.msg)); // TODO gltfModelPathProvider needs to be changed to accept flavours explicitely
        this.scene = app.sceneChanged$.pipe(map(value => value.event.msg));
        this.camera = app.cameraChanged$.pipe(map(value => value.event.msg));
        this.environment = app.environmentChanged$.pipe(map(value => value.event.msg));

        this.app.tonemaps = Object.keys(ToneMaps).map((key) => {
            return {title: ToneMaps[key]};
        });
        this.tonemap = app.tonemapChanged$.pipe(
            map(value => value.event.msg),
            startWith(ToneMaps.LINEAR)
        );

        this.app.debugchannels = Object.keys(DebugOutput).map((key) => {
            return {title: DebugOutput[key]};
        });
        this.debugchannel = app.debugchannelChanged$.pipe(
            map(value => value.event.msg),
            startWith(DebugOutput.NONE)
        );

        this.skinningEnabled = app.skinningChanged$.pipe(map(value => value.event.msg));
        this.morphingEnabled = app.morphingChanged$.pipe(map(value => value.event.msg));
        this.iblEnabled = app.iblChanged$.pipe(map(value => value.event.msg));
        this.punctualLightsEnabled = app.punctualLightsChanged$.pipe(map(value => value.event.msg));
        this.environmentEnabled = app.environmentVisibilityChanged$.pipe(map(value => value.event.msg));
        this.addEnvironment = app.addEnvironment$.pipe(map(() => {/* TODO Open file dialog */}));
        this.clearColor = app.colorChanged$.pipe(
            filter(value => value.event !== undefined),
            map(value => value.event.msg),
            map(msg => msg.target.value ),
            startWith("#303542"),
            map(hex => {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [
                    parseInt(result[1], 16),
                    parseInt(result[2], 16),
                    parseInt(result[3], 16)
                ] : null;
            })
        );
    }

    attachGltfLoaded(gltfLoadedObservable)
    {
        const gltfLoadedAndInit = gltfLoadedObservable.pipe(
            startWith(new glTF())
        );

        const sceneIndices = gltfLoadedAndInit.pipe(
            map( (gltf) => {
                return gltf.scenes.map( (scene, index) => {
                    return {title: index};
                });
            })
        );
        sceneIndices.subscribe( (scenes) => {
            this.app.scenes = scenes;
        });

        const cameraIndices = gltfLoadedAndInit.pipe(
            map( (gltf) => {
                const cameraIndices = [{title: "User Camera"}];
                cameraIndices.push(...gltf.cameras.map( (camera, index) => {
                    return {title: index};
                }));
                return cameraIndices;
            })
        );
        cameraIndices.subscribe( (cameras) => {
            this.app.cameras = cameras;
        });

        const variants = gltfLoadedAndInit.pipe(
            map( (gltf) => {
                if(gltf.variants !== undefined)
                {
                    return gltf.variants.map( (variant, index) => {
                        return {title: index};
                    });
                }
                return [];
            })
        );
        variants.subscribe( (variants) => {
            this.app.materialVariants = variants;
        });

    }
}

export { UIModel };
