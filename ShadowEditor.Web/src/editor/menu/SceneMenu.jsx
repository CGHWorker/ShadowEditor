import { classNames, PropTypes, MenuBar, MenuItem, MenuItemSeparator, Confirm } from '../../third_party';
import Converter from '../../serialization/Converter';
import Ajax from '../../utils/Ajax';
import GISScene from '../../gis/Scene';

/**
 * 场景菜单
 * @author tengge / https://github.com/tengge1
 */
class SceneMenu extends React.Component {
    constructor(props) {
        super(props);

        this.handleCreateEmptyScene = this.handleCreateEmptyScene.bind(this);
        this.handleCreateGISScene = this.handleCreateGISScene.bind(this);
        this.handleSaveScene = this.handleSaveScene.bind(this);
        this.handleSaveAsScene = this.handleSaveAsScene.bind(this);
        this.handleExportScene = this.handleExportScene.bind(this);
    }

    render() {
        return <MenuItem title={_t('Scene')}>
            <MenuItem title={_t('New')}>
                <MenuItem title={_t('Empty Scene')} onClick={this.handleCreateEmptyScene}></MenuItem>
                <MenuItem title={_t('GIS Scene')} onClick={this.handleCreateGISScene}></MenuItem>
            </MenuItem>
            <MenuItem title={_t('Save')} onClick={this.handleSaveScene}></MenuItem>
            <MenuItem title={_t('Save As')} onClick={this.handleSaveAsScene}></MenuItem>
            <MenuItemSeparator />
            <MenuItem title={_t('Publish Scene')} onClick={this.handleExportScene}></MenuItem>
        </MenuItem>;
    }

    // ---------------------------- 新建空场景 ---------------------------------

    handleCreateEmptyScene() {
        var editor = app.editor;

        if (editor.sceneID == null) {
            editor.clear();
            editor.sceneID = null;
            editor.sceneName = null;
            document.title = _t('No Name');
            app.toast(_t('Create empty scene successfully.'));
            return;
        }

        app.confirm({
            title: _t('Confirm'),
            content: _t('All unsaved data will be lost. Are you sure?'),
            onOK: () => {
                editor.clear();
                editor.sceneID = null;
                editor.sceneName = null;
                app.options.sceneType = 'Empty';
                document.title = _t('No Name');
                app.editor.camera.userData.control = 'OrbitControls';
            }
        });
    }

    // --------------------------- 新建GIS场景 -------------------------------------

    handleCreateGISScene() {
        if (app.editor.gis) {
            app.editor.gis.stop();
        }

        app.editor.gis = new GISScene(app);
        app.editor.gis.start();

        app.options.sceneType = 'GIS';

        app.editor.camera.userData.control = '';

        app.call(`sceneGraphChanged`, this);
    }

    // --------------------------- 保存场景 ----------------------------------------

    handleSaveScene() { // 保存场景
        var editor = app.editor;
        var id = editor.sceneID;
        var sceneName = editor.sceneName;

        if (id) { // 编辑场景
            this.commitSave(id, sceneName);
        } else { // 新建场景
            app.prompt({
                title: _t('Save Scene'),
                content: _t('Name'),
                value: _t('New Scene'),
                onOK: name => {
                    this.commitSave(id, name);
                }
            });
        }
    }

    commitSave(id, sceneName) {
        var editor = app.editor;

        // 记录选中物体，以便载入时还原场景选中
        var selected = app.editor.selected;
        if (selected) {
            app.options.selected = selected.uuid;
        }

        var obj = (new Converter()).toJSON({
            options: app.options,
            camera: editor.camera,
            renderer: editor.renderer,
            scripts: editor.scripts,
            animations: editor.animations,
            scene: editor.scene,
            visual: editor.visual,
        });

        var params = {
            Name: sceneName,
            Data: JSON.stringify(obj)
        };

        if (id) {
            params.ID = id;
        }

        Ajax.post(`${app.options.server}/api/Scene/Save`, params, result => {
            var obj = JSON.parse(result);

            if (obj.Code === 200) {
                editor.sceneID = obj.ID;
                editor.sceneName = sceneName;
                document.title = sceneName;
            }

            app.call(`sceneSaved`, this);

            app.toast(obj.Msg);
        });
    }

    // --------------------------- 另存为场景 -------------------------------------

    handleSaveAsScene() {
        var sceneName = app.editor.sceneName;

        if (sceneName == null) {
            sceneName = _t('New Scene');
        }

        app.prompt({
            title: _t('Save Scene'),
            content: _t('Name'),
            value: sceneName,
            onOK: name => {
                app.editor.sceneName = name;
                document.title = name;
                this.commitSaveAs(name);
            }
        });
    }

    commitSaveAs(sceneName) {
        var editor = app.editor;

        var obj = (new Converter()).toJSON({
            options: app.options,
            camera: editor.camera,
            renderer: editor.renderer,
            scripts: editor.scripts,
            animations: editor.animations,
            scene: editor.scene,
            visual: editor.visual,
        });

        Ajax.post(`${app.options.server}/api/Scene/Save`, {
            Name: sceneName,
            Data: JSON.stringify(obj)
        }, result => {
            var obj = JSON.parse(result);

            if (obj.Code === 200) {
                editor.sceneID = obj.ID;
                editor.sceneName = sceneName;
                document.title = sceneName;
            }

            app.call(`sceneSaved`, this);

            app.toast(obj.Msg);
        });
    }

    // -------------------------- 导出场景 --------------------------------

    handleExportScene() {
        var sceneID = app.editor.sceneID;

        if (!sceneID) {
            app.toast(_t('Please open scene first.'));
            return;
        }

        app.confirm({
            title: _t('Query'),
            content: _t('Are you sure to export the current scene?'),
            onOK: () => {
                app.mask(_t('Exporting...'));

                fetch(`${app.options.server}/api/ExportScene/Run?ID=${sceneID}`, {
                    method: 'POST'
                }).then(response => {
                    if (response.ok) {
                        response.json().then(json => {
                            app.unmask();
                            app.toast(json.Msg);
                            window.open(`${app.options.server}${json.Url}`, 'export');
                        });
                    }
                });
            }
        });
    }
}

export default SceneMenu;